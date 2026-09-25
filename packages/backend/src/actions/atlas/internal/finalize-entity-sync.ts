import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import type { SyncLogOperation, DB, Logger } from '@/types.js'
import {
  markEntityAsSynced,
  markEntityAsNotFound,
  markEntityAsFailedSync,
  markEntityAsConflict,
} from '@/actions/entities/common.js'
import { createEntitySyncLog } from '@/actions/atlas/internal/create-sync-log.js'

export const finalizeEntitySyncSuccess = async (
  operation: SyncLogOperation,
  entityId: string,
  atlasId: string,
  db: DB,
  logger: Logger,
) => {
  await db.transaction(async (tx) => {
    await markEntityAsSynced(entityId, atlasId, tx, logger)
    await createEntitySyncLog(
      operation,
      {
        syncStatus: 'synced',
        syncCode: null,
        id: entityId,
        atlasId,
      },
      tx,
    )
  })
}

export const finalizeEntitySyncConflict = async (
  operation: SyncLogOperation,
  entityId: string,
  atlasId: string,
  conflictFields: string[],
  db: DB,
  logger: Logger,
) => {
  await db.transaction(async (tx) => {
    await markEntityAsConflict(entityId, tx, logger)
    await createEntitySyncLog(
      operation,
      {
        syncStatus: 'failed',
        syncCode: 'conflict',
        id: entityId,
        atlasId,
        conflictFields,
      },
      tx,
    )
  })
}

export const finalizeEntitySyncFailure = async (
  operation: SyncLogOperation,
  outcome: 'failed' | 'not_found',
  entityId: string,
  atlasId: string | undefined,
  error: unknown,
  db: DB,
  logger: Logger,
) => {
  await db.transaction(async (tx) => {
    if (outcome === 'not_found') {
      await markEntityAsNotFound(entityId, tx, logger)
    } else {
      await markEntityAsFailedSync(entityId, tx, logger)
    }

    await createEntitySyncLog(
      operation,
      {
        id: entityId,
        atlasId: atlasId ?? null,
        syncStatus: 'failed',
        syncCode: outcome === 'not_found' ? 'not_found' : null,
        errorMessage: error instanceof Error ? error.message : undefined,
        errorDetails: error instanceof AtlasApiError ? error.errors : undefined,
      },
      tx,
    )
  })
}
