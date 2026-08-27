import type { SyncLogOperation, DB, TaxonomyType, SyncStatus, SyncCode } from '@/types.js'
import { syncLogs, type Entity } from '@/db/schema.js'

type EntitySyncLogDetails = {
  syncCode?: SyncCode
  entityId: string
  atlasId?: string
  conflictFields?: string[]
}

type TaxonomySyncLogDetails = {
  taxonomyType: TaxonomyType
  count: number
}

type CreateSyncLogArgs =
  | {
      type: 'entity'
      operation: SyncLogOperation
      syncStatus: SyncStatus
      details: EntitySyncLogDetails
      error?: string
    }
  | {
      type: 'taxonomy'
      operation?: SyncLogOperation
      syncStatus: SyncStatus
      details: TaxonomySyncLogDetails
      error?: string
    }

const getSyncLogValues = (args: CreateSyncLogArgs) => {
  const commonValues = {
    entityType: args.type,
    status: args.syncStatus,
  }

  switch (args.type) {
    case 'taxonomy':
      return {
        ...commonValues,
        operation: args.operation ?? 'sync',
        details: {
          taxonomyType: args.details.taxonomyType,
          count: args.details.count,
          ...(args.error ? { error: args.error } : {}),
        },
      }

    case 'entity':
      return {
        ...commonValues,
        entityId: args.details.entityId,
        operation: args.operation,
        details: {
          atlasId: args.details.atlasId,
          syncCode: args.details.syncCode,
          conflictFields: args.details.conflictFields,
          ...(args.error ? { error: args.error } : {}),
        },
      }
  }
}

export const createSyncLog = async (args: CreateSyncLogArgs, db: DB): Promise<void> => {
  await db.insert(syncLogs).values(getSyncLogValues(args))
}

export const createTaxonomySyncLog = async (
  operation: CreateSyncLogArgs['operation'],
  status: 'synced' | 'failed',
  taxonomyType: TaxonomyType,
  termsCount: number,
  db: DB,
): Promise<void> => {
  await createSyncLog(
    {
      type: 'taxonomy',
      operation,
      syncStatus: status as CreateSyncLogArgs['syncStatus'],
      details: {
        taxonomyType,
        count: termsCount,
      },
    },
    db,
  )
}

export const createEntitySyncLog = async (
  operation: CreateSyncLogArgs['operation'],
  entity: Pick<Entity, 'id' | 'atlasId' | 'syncStatus' | 'syncCode'> & { conflictFields?: string[] },
  db: DB,
): Promise<void> => {
  await createSyncLog(
    {
      type: 'entity',
      operation: operation ?? 'sync',
      syncStatus: entity.syncStatus,
      details: {
        entityId: entity.id,
        atlasId: entity.atlasId ?? undefined,
        syncCode: entity.syncCode ?? undefined,
        conflictFields: entity.conflictFields ?? undefined,
      },
    },
    db,
  )
}
