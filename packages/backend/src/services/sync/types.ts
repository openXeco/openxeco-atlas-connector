import type { Entity } from '@/db/schema.js'

export interface SyncResult {
  success: boolean
  entityId: string
  atlasId?: string
  message: string
  error?: string
}

export interface ConflictReport {
  hasConflict: boolean
  localVersion: Entity
  remoteVersion: Partial<Entity> | null
  localUpdatedAt: Date
  remoteUpdatedAt: Date
  conflictFields: string[]
}

export interface EntityDiff {
  field: string
  // biome-ignore lint/suspicious/noExplicitAny: It's fine here
  localValue: any
  // biome-ignore lint/suspicious/noExplicitAny: It's fine here
  remoteValue: any
  isDifferent: boolean
}

export interface BatchSyncResult {
  total: number
  success: number
  failed: number
  results: SyncResult[]
}
