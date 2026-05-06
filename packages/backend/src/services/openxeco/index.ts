/**
 * OpenXeco Service Module
 *
 * Provides integration with cybersecurity.lu API for importing form data
 */

export { OpenXecoClient, openXecoClient } from './client.js'

export { OpenXecoFormTransformer, openXecoFormTransformer } from './transformer.js'

export type { OpenXecoFormQuestion, OpenXecoFormAnswer, FieldMapping, FieldType } from './types.js'
export type { OpenXecoSession } from '@/services/openxeco/types.js'
export type { OpenXecoCredentials } from '@/services/openxeco/types.js'
export type { TransformResult } from '@/services/openxeco/types.js'
export { MAPPING_BY_ENTITY_FIELD } from '@/services/openxeco/transformer.js'
export { MAPPING_BY_QUESTION_REF } from '@/services/openxeco/transformer.js'
export { QUESTION_TO_ENTITY_MAPPING } from '@/services/openxeco/transformer.js'
