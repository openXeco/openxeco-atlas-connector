import type { BasicErrorResponse } from '@/types.js'
import { z } from 'zod'

/** Business Domain **/
export const ENTITY_STATUSES = [
  'draft',
  'ready_for_publication',
  'published',
  'to_be_rejected',
  'rejected',
  'revision_requested',
] as const

export const SYNC_STATUSES = ['pending_push', 'synced', 'failed'] as const

export const SYNC_CODES = ['conflict', 'not_found'] as const

/** App's specific **/
export const replies: Record<string, BasicErrorResponse> = {
  unauthorized: {
    status: 401,
    error: 'Unauthorized',
  },
  forbidden: {
    status: 403,
    error: 'Forbidden',
  },
  badRequest: {
    status: 400,
    error: 'Validation failed',
  },
  conflict: {
    status: 409,
    error: 'Conflict',
  },
  notFound: {
    status: 404,
    error: 'Not found',
  },
  unexpected: {
    status: 500,
    error: 'Internal server error',
  },
  external: {
    status: 502,
    error: 'External API error',
  },
} as const

/** Settings **/
export const SETTINGS_KEYS = {
  ATLAS_BASE_URL: 'atlas_base_url',
  ATLAS_API_KEY: 'atlas_api_key',
  ATLAS_USERNAME: 'atlas_username',
  ATLAS_PASSWORD: 'atlas_password',
  APP_NAME: 'app_name',
  AUTO_SYNC_ON_PUBLISH: 'auto_sync_on_publish',
  SYNC_CONFLICT_RESOLUTION: 'sync_conflict_resolution',
  COUNTRY: 'country',
} as const

export const TAXONOMY_TYPES = [
  'applications_and_technologies',
  'cluster_thematic_area',
  'cluster_type',
  'country',
  'fields_of_activity',
  'languages',
  'nationality',
  'sectors',
  'technologies',
  'use_cases',
] as const
export const taxonomyTypeSchema = z.enum(TAXONOMY_TYPES)

export const SYNC_LOG_OPERATIONS = ['create', 'update', 'force-create', 'force-push', 'force-pull', 'sync'] as const
export const syncLogOperationSchema = z.enum(SYNC_LOG_OPERATIONS)
