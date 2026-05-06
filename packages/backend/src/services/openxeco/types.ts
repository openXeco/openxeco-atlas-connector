/**
 * OpenXeco (cybersecurity.lu) API Types and Field Mappings
 */

// API Response Types
export interface OpenXecoFormQuestion {
  id: number
  form_id: number
  value: string // The question text
  type: string // TEXT, SELECT, CHECKBOX, TEXTAREA, etc.
  reference: string | null // e.g., "FORM-ECCC-001-Q101"
  status: string
  position: number
  options: string | null // JSON string of options for SELECT/MULTISELECT
}

export interface OpenXecoFormAnswer {
  id: number
  form_question_id: number
  user_id: number
  value: string
}

export interface OpenXecoLoginResponse {
  // Cookie-based auth - response contains session info
  user_id?: number
  email?: string
}

// Field Mapping Types
export type FieldType = 'string' | 'boolean' | 'taxonomy_single' | 'taxonomy_multi' | 'conditional_string'

export interface FieldMapping {
  questionRef: string
  entityField: string
  fieldType: FieldType
  taxonomyType?: string
  conditionalOn?: string
  conditionalValue?: boolean
}

export interface OpenXecoCredentials {
  email: string
  password: string
}

export interface OpenXecoSession {
  accessToken: string
  refreshToken?: string
}

export type QuestionParams = {
  formId?: number
  session: OpenXecoSession
}
export interface TransformResult {
  entity: Record<string, unknown>
  warnings: string[]
  errors: string[]
  unmappedAnswers: string[]
}

export interface TaxonomyCache {
  byNameAndType: Map<string, string> // "name|type" -> uuid
}

export interface AnswerLookup {
  byQuestionRef: Map<string, string>
}
