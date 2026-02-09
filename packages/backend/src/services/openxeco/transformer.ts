/**
 * OpenXeco Form Transformer
 *
 * Transforms cybersecurity.lu form answers into entity form data
 */

import { db } from '../../config/database.js';
import { taxonomies } from '../../db/schema.js';
import { logger } from '../../utils/logger.js';
import {
  QUESTION_TO_ENTITY_MAPPING,
  MAPPING_BY_QUESTION_REF,
  type OpenXecoFormQuestion,
  type OpenXecoFormAnswer,
  type FieldMapping,
} from './types.js';

export interface TransformResult {
  entity: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  unmappedAnswers: string[];
}

interface TaxonomyCache {
  byNameAndType: Map<string, string>; // "name|type" -> uuid
}

interface AnswerLookup {
  byQuestionRef: Map<string, string>;
}

export class OpenXecoFormTransformer {
  private taxonomyCache: TaxonomyCache | null = null;

  /**
   * Main transformation function
   */
  async transform(
    answers: OpenXecoFormAnswer[],
    questions: OpenXecoFormQuestion[]
  ): Promise<TransformResult> {
    const result: TransformResult = {
      entity: {},
      warnings: [],
      errors: [],
      unmappedAnswers: [],
    };

    // Build question ID to reference lookup
    const questionIdToRef = new Map<number, string>();
    for (const q of questions) {
      if (q.reference) {
        questionIdToRef.set(q.id, q.reference);
      }
    }

    // Build answer lookup by question reference
    const answerLookup: AnswerLookup = {
      byQuestionRef: new Map(),
    };

    for (const answer of answers) {
      const ref = questionIdToRef.get(answer.form_question_id);
      if (ref) {
        answerLookup.byQuestionRef.set(ref, answer.value);
      }
    }

    // Pre-load taxonomy cache
    await this.ensureTaxonomyCache();

    // Process each mapping
    for (const mapping of QUESTION_TO_ENTITY_MAPPING) {
      const answerValue = answerLookup.byQuestionRef.get(mapping.questionRef);

      if (answerValue === undefined || answerValue === null || answerValue === '') {
        // Check if this is a conditional field
        if (mapping.conditionalOn) {
          const parentValue = answerLookup.byQuestionRef.get(mapping.conditionalOn);
          const parentBool = this.parseBoolean(parentValue);
          if (parentBool !== mapping.conditionalValue) {
            continue; // Conditional field not required
          }
        }
        continue;
      }

      try {
        const transformedValue = await this.transformField(
          mapping,
          answerValue,
          answerLookup,
          result
        );

        if (transformedValue !== undefined) {
          result.entity[mapping.entityField] = transformedValue;
        }
      } catch (error) {
        result.errors.push(
          `Failed to transform ${mapping.questionRef} -> ${mapping.entityField}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    // Track unmapped answers
    for (const ref of answerLookup.byQuestionRef.keys()) {
      if (!MAPPING_BY_QUESTION_REF.has(ref)) {
        result.unmappedAnswers.push(ref);
      }
    }

    // Set default values
    result.entity.moderationState = 'draft';

    return result;
  }

  private async transformField(
    mapping: FieldMapping,
    value: string,
    answerLookup: AnswerLookup,
    result: TransformResult
  ): Promise<unknown> {
    switch (mapping.fieldType) {
      case 'string':
        return this.transformString(value);

      case 'boolean':
        return this.transformBoolean(value, mapping, result);

      case 'taxonomy_single':
        return this.transformTaxonomySingle(value, mapping, result);

      case 'taxonomy_multi':
        return this.transformTaxonomyMulti(value, mapping, result);

      case 'conditional_string':
        return this.transformConditionalString(value, mapping, answerLookup);

      default:
        result.warnings.push(`Unknown field type for ${mapping.questionRef}`);
        return value;
    }
  }

  private transformString(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private transformBoolean(
    value: string,
    mapping: FieldMapping,
    result: TransformResult
  ): boolean | undefined {
    const parsed = this.parseBoolean(value);
    if (parsed === null) {
      result.warnings.push(`Could not parse boolean value "${value}" for ${mapping.questionRef}`);
      return undefined;
    }
    return parsed;
  }

  private parseBoolean(value: string | undefined): boolean | null {
    if (value === undefined || value === null) return null;

    const normalized = value.toLowerCase().trim();

    const trueValues = ['true', 'yes', 'oui', 'ja', '1', 'on', 'checked'];
    const falseValues = ['false', 'no', 'non', 'nein', '0', 'off', 'unchecked'];

    if (trueValues.includes(normalized)) return true;
    if (falseValues.includes(normalized)) return false;

    return null;
  }

  private async transformTaxonomySingle(
    value: string,
    mapping: FieldMapping,
    result: TransformResult
  ): Promise<string | undefined> {
    if (!mapping.taxonomyType) {
      result.errors.push(`No taxonomy type specified for ${mapping.questionRef}`);
      return undefined;
    }

    const uuid = await this.lookupTaxonomyByName(value, mapping.taxonomyType);

    if (!uuid) {
      result.warnings.push(
        `Taxonomy term not found: "${value}" in type "${mapping.taxonomyType}" for ${mapping.questionRef}`
      );
      return undefined;
    }

    return uuid;
  }

  private async transformTaxonomyMulti(
    value: string,
    mapping: FieldMapping,
    result: TransformResult
  ): Promise<string[] | undefined> {
    if (!mapping.taxonomyType) {
      result.errors.push(`No taxonomy type specified for ${mapping.questionRef}`);
      return undefined;
    }

    // Parse the value - could be JSON array or comma-separated
    let names: string[];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        names = parsed.map((v) => String(v).trim()).filter(Boolean);
      } else {
        names = [String(parsed).trim()];
      }
    } catch {
      // Fall back to comma-separated
      names = value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (names.length === 0) {
      return undefined;
    }

    const uuids: string[] = [];
    const notFound: string[] = [];

    for (const name of names) {
      const uuid = await this.lookupTaxonomyByName(name, mapping.taxonomyType);
      if (uuid) {
        uuids.push(uuid);
      } else {
        notFound.push(name);
      }
    }

    if (notFound.length > 0) {
      result.warnings.push(
        `Some taxonomy terms not found for ${mapping.questionRef}: ${notFound.join(', ')}`
      );
    }

    return uuids.length > 0 ? uuids : undefined;
  }

  private transformConditionalString(
    value: string,
    mapping: FieldMapping,
    answerLookup: AnswerLookup
  ): string | undefined {
    if (!mapping.conditionalOn) {
      return this.transformString(value);
    }

    const parentValue = answerLookup.byQuestionRef.get(mapping.conditionalOn);
    const parentBool = this.parseBoolean(parentValue);

    if (parentBool === mapping.conditionalValue) {
      return this.transformString(value);
    }

    return undefined;
  }

  private async ensureTaxonomyCache(): Promise<void> {
    if (this.taxonomyCache) return;

    logger.info('Loading taxonomy cache for OpenXeco transformation');

    const allTaxonomies = await db.select().from(taxonomies);

    this.taxonomyCache = {
      byNameAndType: new Map(),
    };

    for (const tax of allTaxonomies) {
      // Key by lowercase name and type for case-insensitive matching
      const nameKey = `${tax.name.toLowerCase()}|${tax.taxonomyType}`;
      this.taxonomyCache.byNameAndType.set(nameKey, tax.id);
    }

    logger.info(`Taxonomy cache loaded: ${allTaxonomies.length} terms`);
  }

  private async lookupTaxonomyByName(
    name: string,
    taxonomyType: string
  ): Promise<string | undefined> {
    await this.ensureTaxonomyCache();

    if (!this.taxonomyCache) return undefined;

    // Try exact match (case-insensitive)
    const exactKey = `${name.toLowerCase()}|${taxonomyType}`;
    const exactMatch = this.taxonomyCache.byNameAndType.get(exactKey);
    if (exactMatch) return exactMatch;

    // Try normalized match (remove extra spaces)
    const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedKey = `${normalized}|${taxonomyType}`;
    const normalizedMatch = this.taxonomyCache.byNameAndType.get(normalizedKey);
    if (normalizedMatch) return normalizedMatch;

    return undefined;
  }

  clearCache(): void {
    this.taxonomyCache = null;
    logger.info('Taxonomy cache cleared');
  }
}

// Singleton instance
export const openXecoFormTransformer = new OpenXecoFormTransformer();
