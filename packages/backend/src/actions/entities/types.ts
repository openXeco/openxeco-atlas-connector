import type { SyncStatus, EntityStatus } from '@/types.js'

export type EntitiesStatusRecap = {
  total: number
  moderation: Record<EntityStatus, number>
  sync: Record<SyncStatus, number>
}
