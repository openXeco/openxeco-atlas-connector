import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { AtlasActionDependencies, ForceCreateEntityResult, AtlasCluster } from '@/actions/atlas/types.js'
import { createRemoteEntity } from '@/actions/atlas/internal/create-remote-entity.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { canEntityBePushed, markEntityAsPendingPush } from '@/actions/entities/common.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { createSyncLog } from '@/actions/atlas/internal/create-sync-log.js'
import { finalizeEntitySyncFailure, finalizeEntitySyncSuccess } from '@/actions/atlas/internal/finalize-entity-sync.js'

export const forceCreateEntity = async ({
  id,
  db,
  logger,
  dependencies: { atlasClient },
}: ActionArgsWithDb<undefined, AtlasActionDependencies>): Promise<ActionResult<ForceCreateEntityResult>> => {
  if (!id) {
    return {
      success: false,
      code: 'validation',
      message: 'Entity id is required.',
    }
  }

  const entityResult = await getEntity({ id, db, logger })

  if (!entityResult.success) {
    return {
      success: false,
      code: 'notFound',
      message: `Entity with id ${id} was not found.`,
    }
  }

  const entity = entityResult.data

  if (!canEntityBePushed(entity)) {
    return {
      success: false,
      code: 'validation',
      message: `Entity with id ${id} cannot be created in ATLAS. Current synchronization status: ${entity.syncStatus}.`,
    }
  }

  if (entity.atlasId) {
    try {
      await getClusterByID(entity.atlasId, atlasClient)

      await createSyncLog(
        {
          type: 'entity',
          operation: 'force-create',
          syncStatus: 'failed',
          error: `The entity ${id} was already linked to ${entity.atlasId}.`,
          details: {
            entityId: id,
            atlasId: entity.atlasId,
          },
        },
        db,
      )

      return {
        success: false,
        code: 'validation',
        message: `The entity ${id} is already linked to ${entity.atlasId}.`,
      }
    } catch (error) {
      if (!(error instanceof AtlasApiError && error.status === 404)) {
        await createSyncLog(
          {
            type: 'entity',
            operation: 'force-create',
            syncStatus: 'failed',
            error: 'Could not verify the existing ATLAS entity.',
            details: {
              entityId: id,
              atlasId: entity.atlasId,
            },
          },
          db,
        )
        return {
          success: false,
          code: 'external',
          message: 'Could not verify the existing ATLAS entity.',
          error: error as Error,
        }
      }
    }
  }

  const input = toClusterInputFromEntity(entity)

  await markEntityAsPendingPush(id, db, logger)
  let created: AtlasCluster

  try {
    created = await createRemoteEntity({ input, atlasClient })
  } catch (error) {
    try {
      await finalizeEntitySyncFailure('force-create', 'failed', id, undefined, db, logger)
    } catch (e) {
      logger.warn({ error: e, entityId: id }, 'Error while creating sync log for force-create')
    }

    return {
      success: false,
      code: 'unexpected',
      message: (error as Error).message,
    }
  }

  try {
    await finalizeEntitySyncSuccess('force-create', id, created.atlasId, db, logger)
    return {
      success: true,
      data: {
        code: 'synced',
        operation: 'created',
        entityId: id,
        atlasId: created.atlasId,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Atlas entity created but failed to persist sync status')
    return {
      success: false,
      code: 'unexpected',
      message: 'ATLAS entity created but failed to persist sync status',
    }
  }
}
