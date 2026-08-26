import type { EntityStatus, SyncCode, SyncStatus } from '@/types'

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

export type EntityAction =
  | 'edit'
  | 'push'
  | 'pull'
  | 'retry_push'
  | 'force_push'
  | 'force_pull'
  | 'recover_correspondence'
  | 'select_correspondence'
  | 'force_create'

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

type StatusDefinition = {
  label: string
  description: string
  tone: StatusTone
  requiresAttention: boolean
  actions: readonly EntityAction[]
}

export const ENTITY_STATUS_DEFINITIONS = {
  draft: {
    label: 'Draft',
    description: 'The entity is still being prepared and has not been submitted for publication.',
    tone: 'neutral',
    requiresAttention: false,
    actions: ['edit'],
  },
  ready_for_publication: {
    label: 'Ready for publication',
    description: 'The entity is ready to be reviewed and published by ATLAS.',
    tone: 'warning',
    requiresAttention: false,
    actions: ['edit'],
  },
  published: {
    label: 'Published',
    description: 'The entity has been approved and published in ATLAS.',
    tone: 'success',
    requiresAttention: false,
    actions: ['edit'],
  },
  to_be_rejected: {
    label: 'To be rejected',
    description: 'The entity has been submitted to ATLAS for rejection.',
    tone: 'warning',
    requiresAttention: false,
    actions: ['edit'],
  },
  rejected: {
    label: 'Rejected',
    description: 'The entity has been rejected.',
    tone: 'danger',
    requiresAttention: false,
    actions: ['edit'],
  },
  revision_requested: {
    label: 'Revision requested',
    description: 'ATLAS has requested changes before the entity can proceed.',
    tone: 'warning',
    requiresAttention: true,
    actions: ['edit'],
  },
} as const satisfies Record<EntityStatus, StatusDefinition>

export const SYNC_STATUS_DEFINITIONS = {
  pending_push: {
    label: 'Pending',
    description: 'Local changes are waiting to be sent to ATLAS.',
    tone: 'info',
    requiresAttention: true,
    actions: ['push'],
  },
  synced: {
    label: 'Synced',
    description: 'The local entity and its ATLAS version were synchronized successfully.',
    tone: 'success',
    requiresAttention: false,
    actions: ['pull'],
  },
  failed: {
    label: 'Failed',
    description: 'The last synchronization attempt failed.',
    tone: 'danger',
    requiresAttention: true,
    actions: ['retry_push'],
  },
} as const satisfies Record<SyncStatus, StatusDefinition>

export const SYNC_CODE_DEFINITIONS = {
  conflict: {
    label: 'Conflict',
    description: 'Both the local entity and its ATLAS version contain changes. Choose which version should win.',
    tone: 'warning',
    requiresAttention: true,
    actions: ['force_push', 'force_pull'],
  },
  not_found: {
    label: 'Not found in ATLAS',
    description: 'The linked ATLAS entity no longer exists. Look for a correspondence or create a new ATLAS entity.',
    tone: 'danger',
    requiresAttention: true,
    actions: ['recover_correspondence'],
  },
} as const satisfies Record<SyncCode, StatusDefinition>

const getStatusLabels = <T extends string>(definitions: Record<T, StatusDefinition>): Record<T, string> => {
  const entries = Object.entries(definitions) as Array<[T, StatusDefinition]>

  return Object.fromEntries(entries.map(([status, definition]) => [status, definition.label])) as Record<T, string>
}

export const MODERATION_STATUS_LABELS = getStatusLabels<EntityStatus>(ENTITY_STATUS_DEFINITIONS)
export const SYNC_STATUS_LABELS = getStatusLabels<SyncStatus>(SYNC_STATUS_DEFINITIONS)

type EntitySyncState = {
  atlasId: string | null
  syncStatus: SyncStatus
  syncCode: SyncCode | null
}

export const getEntitySyncActions = ({ atlasId, syncStatus, syncCode }: EntitySyncState): readonly EntityAction[] => {
  if (syncStatus === 'failed' && syncCode) {
    return SYNC_CODE_DEFINITIONS[syncCode].actions
  }

  if (syncStatus === 'synced' && !atlasId) {
    return []
  }

  return SYNC_STATUS_DEFINITIONS[syncStatus].actions
}
