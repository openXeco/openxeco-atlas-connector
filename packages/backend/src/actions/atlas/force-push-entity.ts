import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { AtlasActionDependencies, ForcePushEntityResult } from '@/actions/atlas/types.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import {
  markEntityAsFailedSync,
  markEntityAsNotFound,
  markEntityAsPendingPush,
  markEntityAsSynced,
} from '@/actions/entities/common.js'

export const forcePushEntity = async ({
  id,
  db,
  logger,
  dependencies: { atlasClient },
}: ActionArgsWithDb<undefined, AtlasActionDependencies>): Promise<ActionResult<ForcePushEntityResult>> => {
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

  if (!entity.atlasId) {
    return {
      success: true,
      data: { code: 'not_linked', entityId: id },
    }
  }

  if (entity.syncStatus !== 'failed' || entity.syncCode !== 'conflict') {
    return {
      success: true,
      data: { code: 'no_conflict', entityId: id },
    }
  }

  const atlasId = entity.atlasId
  const input = toClusterInputFromEntity(entity)

  try {
    return await db.transaction(async (tx) => {
      await markEntityAsPendingPush(id, tx, logger)

      const updateResult = await updateRemoteEntity({
        atlasId,
        input,
        lastSyncedAt: null,
        conflictPolicy: 'overwrite',
        atlasClient,
      })

      if (updateResult.code === 'not_found') {
        await markEntityAsNotFound(id, tx, logger)

        return {
          success: true,
          data: {
            code: 'remote_not_found',
            entityId: id,
            atlasId,
          },
        }
      }

      if (updateResult.code === 'conflict') {
        throw new Error('Forced ATLAS update unexpectedly returned a conflict.')
      }

      await markEntityAsSynced(id, updateResult.cluster.atlasId, tx, logger)

      return {
        success: true,
        data: {
          code: 'synced',
          entityId: id,
          atlasId: updateResult.cluster.atlasId,
        },
      }
    })
  } catch (error) {
    await markEntityAsFailedSync(id, db, logger)

    return {
      success: false,
      code: 'external',
      message: `Unable to force push entity ${id} to ATLAS.`,
      error: error as Error,
    }
  }
}
