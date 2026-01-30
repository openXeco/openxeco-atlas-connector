/**
 * OpenXeco (cybersecurity.lu) API Types and Field Mappings
 */

// API Response Types
export interface OpenXecoFormQuestion {
  id: number;
  form_id: number;
  value: string; // The question text
  type: string; // TEXT, SELECT, CHECKBOX, TEXTAREA, etc.
  reference: string | null; // e.g., "FORM-ECCC-001-Q101"
  status: string;
  position: number;
  options: string | null; // JSON string of options for SELECT/MULTISELECT
}

export interface OpenXecoFormAnswer {
  id: number;
  form_question_id: number;
  user_id: number;
  value: string;
}

export interface OpenXecoLoginResponse {
  // Cookie-based auth - response contains session info
  user_id?: number;
  email?: string;
}

// Field Mapping Types
export type FieldType =
  | 'string'
  | 'boolean'
  | 'taxonomy_single'
  | 'taxonomy_multi'
  | 'conditional_string';

export interface FieldMapping {
  questionRef: string;
  entityField: string;
  fieldType: FieldType;
  taxonomyType?: string;
  conditionalOn?: string;
  conditionalValue?: boolean;
}

/**
 * Complete mapping from ECCC form question references to entity fields
 */
export const QUESTION_TO_ENTITY_MAPPING: FieldMapping[] = [
  // Step 1: Organisation
  { questionRef: 'FORM-ECCC-001-Q101', entityField: 'nameNational', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q101b', entityField: 'name', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q101c', entityField: 'entityDepartment', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q102', entityField: 'countryId', fieldType: 'taxonomy_single', taxonomyType: 'country' },
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
  { questionRef: 'FORM-ECCC-001-Q110', entityField: 'organizationTypeId', fieldType: 'taxonomy_single', taxonomyType: 'organization_type' },
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
  { questionRef: 'FORM-ECCC-001-Q301', entityField: 'fieldsOfActivityIds', fieldType: 'taxonomy_multi', taxonomyType: 'fields_of_activity' },
  { questionRef: 'FORM-ECCC-001-Q302', entityField: 'expertiseDescription', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q303-1', entityField: 'thematicAreaIds', fieldType: 'taxonomy_multi', taxonomyType: 'cluster_thematic_area' },
  { questionRef: 'FORM-ECCC-001-Q303-3', entityField: 'sectorIds', fieldType: 'taxonomy_multi', taxonomyType: 'sectors' },
  { questionRef: 'FORM-ECCC-001-Q303-4', entityField: 'otherSectors', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q303-5', entityField: 'technologyIds', fieldType: 'taxonomy_multi', taxonomyType: 'technologies' },
  { questionRef: 'FORM-ECCC-001-Q303-6', entityField: 'otherTechnologies', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q303-7', entityField: 'useCaseIds', fieldType: 'taxonomy_multi', taxonomyType: 'use_cases' },
  { questionRef: 'FORM-ECCC-001-Q303-8', entityField: 'otherUseCases', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q303-2', entityField: 'goalsToAchieve', fieldType: 'string' },
  { questionRef: 'FORM-ECCC-001-Q305', entityField: 'goalsToContribute', fieldType: 'string' },

  // Step 4: Confirmation
  { questionRef: 'FORM-ECCC-001-Q114', entityField: 'dataProtectionConsent', fieldType: 'boolean' },
  { questionRef: 'FORM-ECCC-001-Q501', entityField: 'formCompletionConfirmed', fieldType: 'boolean' },
];

// Lookup maps for fast access
export const MAPPING_BY_QUESTION_REF = new Map<string, FieldMapping>(
  QUESTION_TO_ENTITY_MAPPING.map((m) => [m.questionRef, m])
);

export const MAPPING_BY_ENTITY_FIELD = new Map<string, FieldMapping>(
  QUESTION_TO_ENTITY_MAPPING.map((m) => [m.entityField, m])
);
