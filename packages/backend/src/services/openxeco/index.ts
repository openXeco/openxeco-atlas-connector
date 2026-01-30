/**
 * OpenXeco Service Module
 *
 * Provides integration with cybersecurity.lu API for importing form data
 */

export { OpenXecoClient, openXecoClient } from './client.js';
export type { OpenXecoCredentials, OpenXecoSession } from './client.js';

export { OpenXecoFormTransformer, openXecoFormTransformer } from './transformer.js';
export type { TransformResult } from './transformer.js';

export {
  QUESTION_TO_ENTITY_MAPPING,
  MAPPING_BY_QUESTION_REF,
  MAPPING_BY_ENTITY_FIELD,
} from './types.js';
export type {
  OpenXecoFormQuestion,
  OpenXecoFormAnswer,
  FieldMapping,
  FieldType,
} from './types.js';
