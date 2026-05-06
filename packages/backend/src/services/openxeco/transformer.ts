/**
 * OpenXeco Form Transformer
 *
 * Transforms cybersecurity.lu form answers into entity form data
 */

import { db } from '@/config/database.js'
import { taxonomies } from '@/db/schema.js'
import type {
  OpenXecoFormQuestion,
  OpenXecoFormAnswer,
  FieldMapping,
  AnswerLookup,
  TaxonomyCache,
  TransformResult,
} from './types.js'
import type { Logger } from 'pino'
import { getLogger } from '@/utils/logger.js'

/**
 * Complete mapping from ECCC form question references to entity fields
 */
export const QUESTION_TO_ENTITY_MAPPING: FieldMapping[] = [
  // Step 1: Organisation
  { questionRef: 'FORM-ECCC-001-Q101', entityField: 'nameNational', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q101b', entityField: 'name', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q101c', entityField: 'entityDepartment', fieldType: 'string' },
  {
    questionRef: 'FORM-ECCC-001-Q102',
    entityField: 'countryId',
    fieldType: 'taxonomy_single',
    taxonomyType: 'country',
  },
  { questionRef: 'FORM-ECCC-001-Q103', entityField: 'streetAddress', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q104', entityField: 'city', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q105', entityField: 'registrationNumber', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q106', entityField: 'isHeadquarter', fieldType: 'boolean' },
  {
    questionRef: 'FORM-ECCC-001-Q106b',
    entityField: 'headquarterInfo',
    fieldType: 'conditional_string',
    conditionalOn: 'FORM-ECCC-001-Q106',
    conditionalValue: false,
  },
  { questionRef: 'FORM-ECCC-001-Q107', entityField: 'website', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q108', entityField: 'phone', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q109', entityField: 'email', fieldType: 'string' },
  {
    questionRef: 'FORM-ECCC-001-Q110',
    entityField: 'organizationTypeId',
    fieldType: 'taxonomy_single',
    taxonomyType: 'organization_type',
  },
  { questionRef: 'FORM-ECCC-001-Q111', entityField: 'hasSubsidiaries', fieldType: 'boolean' },
  {
    questionRef: 'FORM-ECCC-001-Q111b',
    entityField: 'subsidiariesDetails',
    fieldType: 'conditional_string',
    conditionalOn: 'FORM-ECCC-001-Q111',
    conditionalValue: true,
  },
  { questionRef: 'FORM-ECCC-001-Q112', entityField: 'hasMajorityShares', fieldType: 'boolean' },
  {
    questionRef: 'FORM-ECCC-001-Q112b',
    entityField: 'majoritySharesDetails',
    fieldType: 'conditional_string',
    conditionalOn: 'FORM-ECCC-001-Q112',
    conditionalValue: true,
  },
  { questionRef: 'FORM-ECCC-001-Q113', entityField: 'article138Compliance', fieldType: 'boolean' },

  // Step 2: Contact Person
  { questionRef: 'FORM-ECCC-001-Q201', entityField: 'contactFirstName', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q202', entityField: 'contactLastName', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q203', entityField: 'contactPosition', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q205', entityField: 'contactEmail', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q206', entityField: 'contactPhone', fieldType: 'string' },

  // Step 3: Expertise
  {
    questionRef: 'FORM-ECCC-001-Q301',
    entityField: 'fieldsOfActivityIds',
    fieldType: 'taxonomy_multi',
    taxonomyType: 'fields_of_activity',
  },
  { questionRef: 'FORM-ECCC-001-Q302', entityField: 'expertiseDescription', fieldType: 'string' },
  {
    questionRef: 'FORM-ECCC-001-Q303-1',
    entityField: 'thematicAreaIds',
    fieldType: 'taxonomy_multi',
    taxonomyType: 'cluster_thematic_area',
  },
  {
    questionRef: 'FORM-ECCC-001-Q303-3',
    entityField: 'sectorIds',
    fieldType: 'taxonomy_multi',
    taxonomyType: 'sectors',
  },
  {
    questionRef: 'FORM-ECCC-001-Q303-5',
    entityField: 'technologyIds',
    fieldType: 'taxonomy_multi',
    taxonomyType: 'technologies',
  },
  {
    questionRef: 'FORM-ECCC-001-Q303-7',
    entityField: 'useCaseIds',
    fieldType: 'taxonomy_multi',
    taxonomyType: 'use_cases',
  },
  { questionRef: 'FORM-ECCC-001-Q303-2', entityField: 'goalsToAchieve', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q305', entityField: 'goalsToContribute', fieldType: 'string' },

  // Step 4: Confirmation
  { questionRef: 'FORM-ECCC-001-Q114', entityField: 'dataProtectionConsent', fieldType: 'boolean' },
  {
    questionRef: 'FORM-ECCC-001-Q501',
    entityField: 'formCompletionConfirmed',
    fieldType: 'boolean',
  },
]

// Lookup maps for fast access
export const MAPPING_BY_QUESTION_REF = new Map<string, FieldMapping>(
  QUESTION_TO_ENTITY_MAPPING.map((m) => [m.questionRef, m]),
)

export const MAPPING_BY_ENTITY_FIELD = new Map<string, FieldMapping>(
  QUESTION_TO_ENTITY_MAPPING.map((m) => [m.entityField, m]),
)

export class OpenXecoFormTransformer {
  private taxonomyCache: TaxonomyCache | null = null
  private readonly logger: Logger

  constructor() {
    this.logger = getLogger()
  }

  /**
   * Main transformation function
   */
  async transform(answers: OpenXecoFormAnswer[], questions: OpenXecoFormQuestion[]): Promise<TransformResult> {
    const result: TransformResult = {
      entity: {},
      warnings: [],
      errors: [],
      unmappedAnswers: [],
    }

    // Build question ID to reference lookup
    const questionIdToRef = new Map<number, string>()
    for (const q of questions) {
      if (q.reference) {
        questionIdToRef.set(q.id, q.reference)
      }
    }

    // Build answer lookup by question reference
    const answerLookup: AnswerLookup = {
      byQuestionRef: new Map(),
    }

    for (const answer of answers) {
      const ref = questionIdToRef.get(answer.form_question_id)
      if (ref) {
        answerLookup.byQuestionRef.set(ref, answer.value)
      }
    }

    // Pre-load taxonomy cache
    await this.ensureTaxonomyCache()

    // Process each mapping
    for (const mapping of QUESTION_TO_ENTITY_MAPPING) {
      const answerValue = answerLookup.byQuestionRef.get(mapping.questionRef)

      if (answerValue === undefined || answerValue === null || answerValue === '') {
        // Check if this is a conditional field
        if (mapping.conditionalOn) {
          const parentValue = answerLookup.byQuestionRef.get(mapping.conditionalOn)
          const parentBool = this.parseBoolean(parentValue)
          if (parentBool !== mapping.conditionalValue) {
            continue // Conditional field not required
          }
        }
        continue
      }

      try {
        const transformedValue = await this.transformField(mapping, answerValue, answerLookup, result)

        if (transformedValue !== undefined) {
          result.entity[mapping.entityField] = transformedValue
        }
      } catch (error) {
        result.errors.push(
          `Failed to transform ${mapping.questionRef} -> ${mapping.entityField}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    }

    // Track unmapped answers
    for (const ref of answerLookup.byQuestionRef.keys()) {
      if (!MAPPING_BY_QUESTION_REF.has(ref)) {
        result.unmappedAnswers.push(ref)
      }
    }

    // Set default values
    result.entity.moderationState = 'draft'

    return result
  }

  private async transformField(
    mapping: FieldMapping,
    value: string,
    answerLookup: AnswerLookup,
    result: TransformResult,
  ): Promise<unknown> {
    switch (mapping.fieldType) {
      case 'string':
        return this.transformString(value)

      case 'boolean':
        return this.transformBoolean(value, mapping, result)

      case 'taxonomy_single':
        return this.transformTaxonomySingle(value, mapping, result)

      case 'taxonomy_multi':
        return this.transformTaxonomyMulti(value, mapping, result)

      case 'conditional_string':
        return this.transformConditionalString(value, mapping, answerLookup)

      default:
        result.warnings.push(`Unknown field type for ${mapping.questionRef}`)
        return value
    }
  }

  private transformString(value: string): string | undefined {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  private transformBoolean(value: string, mapping: FieldMapping, result: TransformResult): boolean | undefined {
    const parsed = this.parseBoolean(value)
    if (parsed === null) {
      result.warnings.push(`Could not parse boolean value "${value}" for ${mapping.questionRef}`)
      return undefined
    }
    return parsed
  }

  private parseBoolean(value: string | undefined): boolean | null {
    if (value === undefined || value === null) {
      return null
    }

    const normalized = value.toLowerCase().trim()

    const trueValues = ['true', 'yes', 'oui', 'ja', '1', 'on', 'checked']
    const falseValues = ['false', 'no', 'non', 'nein', '0', 'off', 'unchecked']

    if (trueValues.includes(normalized)) {
      return true
    }

    if (falseValues.includes(normalized)) {
      return false
    }

    return null
  }

  private async transformTaxonomySingle(
    value: string,
    mapping: FieldMapping,
    result: TransformResult,
  ): Promise<string | undefined> {
    if (!mapping.taxonomyType) {
      result.errors.push(`No taxonomy type specified for ${mapping.questionRef}`)
      return undefined
    }

    const uuid = await this.lookupTaxonomyByName(value, mapping.taxonomyType)

    if (!uuid) {
      result.warnings.push(
        `Taxonomy term not found: "${value}" in type "${mapping.taxonomyType}" for ${mapping.questionRef}`,
      )
      return undefined
    }

    return uuid
  }

  private async transformTaxonomyMulti(
    value: string,
    mapping: FieldMapping,
    result: TransformResult,
  ): Promise<string[] | undefined> {
    if (!mapping.taxonomyType) {
      result.errors.push(`No taxonomy type specified for ${mapping.questionRef}`)
      return undefined
    }

    // Parse the value - could be JSON array or comma-separated
    let names: string[]
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        names = parsed.map((v) => String(v).trim()).filter(Boolean)
      } else {
        names = [String(parsed).trim()]
      }
    } catch {
      // Fall back to comma-separated
      names = value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    }

    if (names.length === 0) {
      return undefined
    }

    const uuids: string[] = []
    const notFound: string[] = []

    for (const name of names) {
      const uuid = await this.lookupTaxonomyByName(name, mapping.taxonomyType)
      if (uuid) {
        uuids.push(uuid)
      } else {
        notFound.push(name)
      }
    }

    if (notFound.length > 0) {
      result.warnings.push(`Some taxonomy terms not found for ${mapping.questionRef}: ${notFound.join(', ')}`)
    }

    return uuids.length > 0 ? uuids : undefined
  }

  private transformConditionalString(
    value: string,
    mapping: FieldMapping,
    answerLookup: AnswerLookup,
  ): string | undefined {
    if (!mapping.conditionalOn) {
      return this.transformString(value)
    }

    const parentValue = answerLookup.byQuestionRef.get(mapping.conditionalOn)
    const parentBool = this.parseBoolean(parentValue)

    if (parentBool === mapping.conditionalValue) {
      return this.transformString(value)
    }

    return undefined
  }

  private async ensureTaxonomyCache(): Promise<void> {
    if (this.taxonomyCache) return

    this.logger.info('Loading taxonomy cache for OpenXeco transformation')

    const allTaxonomies = await db.select().from(taxonomies)

    this.taxonomyCache = {
      byNameAndType: new Map(),
    }

    for (const tax of allTaxonomies) {
      // Key by lowercase name and type for case-insensitive matching
      const nameKey = `${tax.name.toLowerCase()}|${tax.taxonomyType}`
      this.taxonomyCache.byNameAndType.set(nameKey, tax.id)
    }

    this.logger.info(`Taxonomy cache loaded: ${allTaxonomies.length} terms`)
  }

  private async lookupTaxonomyByName(name: string, taxonomyType: string): Promise<string | undefined> {
    await this.ensureTaxonomyCache()

    if (!this.taxonomyCache) {
      return undefined
    }

    // Try exact match (case-insensitive)
    const exactKey = `${name.toLowerCase()}|${taxonomyType}`
    const exactMatch = this.taxonomyCache.byNameAndType.get(exactKey)

    if (exactMatch) {
      return exactMatch
    }

    // Try normalized match (remove extra spaces)
    const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ')
    const normalizedKey = `${normalized}|${taxonomyType}`
    const normalizedMatch = this.taxonomyCache.byNameAndType.get(normalizedKey)

    return normalizedMatch || undefined
  }

  clearCache(): void {
    this.taxonomyCache = null
    this.logger.info('Taxonomy cache cleared')
  }
}

// Singleton instance
export const openXecoFormTransformer = new OpenXecoFormTransformer()
