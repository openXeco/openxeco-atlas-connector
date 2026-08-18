import type { EntityStatus, SyncStatus } from '@/types'

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

export const MODERATION_STATUS_LABELS: Record<EntityStatus, string> = {
  draft: 'Draft',
  ready_for_publication: 'Ready for publication',
  published: 'Published',
  to_be_rejected: 'To Be Rejected',
  rejected: 'Rejected',
  revision_requested: 'Revision Requested',
}

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  pending_push: 'Pending',
  synced: 'Synced',
  failed: 'Failed',
}
