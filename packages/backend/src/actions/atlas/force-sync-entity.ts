import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type {
  AtlasActionDependencies,
  ForceSyncEntityResult,
  AtlasCluster,
  UpdateAtlasEntityResult,
} from '@/actions/atlas/types.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { finalizeEntitySyncFailure, finalizeEntitySyncSuccess } from '@/actions/atlas/internal/finalize-entity-sync.js'
import { replaceLocalEntityFromAtlas } from '@/actions/atlas/internal/replace-local-entity-from-atlas.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'

export const forceSyncEntity = async (
  { id, db, logger, dependencies: { atlasClient } }: ActionArgsWithDb<undefined, AtlasActionDependencies>,
  action: 'pull' | 'push',
): Promise<ActionResult<ForceSyncEntityResult>> => {
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
      success: false,
      code: 'validation',
      message: `The entity ${id} is not linked with any ATLAS counterpart.`,
    }
  }

  const atlasId = entity.atlasId
  let remote: AtlasCluster

  switch (action) {
    case 'pull': {
      try {
        remote = await getClusterByID(atlasId, atlasClient)
      } catch (error) {
        if (error instanceof AtlasApiError && error.status === 404) {
          await finalizeEntitySyncFailure('force-pull', 'not_found', id, atlasId, error, db, logger)

          return {
            success: false,
            code: 'notFound',
            message: `Remote entity ${atlasId} not found.`,
          }
        }

        await finalizeEntitySyncFailure('force-pull', 'failed', id, atlasId, error, db, logger)

        return {
          success: false,
          code: 'external',
          message: `Unable to force pull entity ${id} from ATLAS.`,
          error: error as Error,
        }
      }

      try {
        return await db.transaction(async (tx) => {
          await replaceLocalEntityFromAtlas(id, remote, tx)
          await finalizeEntitySyncSuccess('force-pull', id, atlasId, tx, logger)

          return {
            success: true,
            data: {
              code: 'synced',
              entityId: id,
              atlasId,
            },
          }
        })
      } catch (error) {
        return {
          success: false,
          code: 'unexpected',
          message: 'ATLAS data was retrieved, but the local update could not be saved.',
          error: error as Error,
        }
      }
    }

    case 'push': {
      const input = toClusterInputFromEntity(entity)
      let updateResult: UpdateAtlasEntityResult

      try {
        updateResult = await updateRemoteEntity({
          atlasId,
          input,
          lastSyncedAt: null,
          conflictPolicy: 'overwrite',
          atlasClient,
        })
      } catch (error) {
        return {
          success: false,
          code: 'external',
          message: `Unable to force push entity ${id} to ATLAS.`,
          error: error as Error,
        }
      }

      if (updateResult.code === 'not_found') {
        try {
          await finalizeEntitySyncFailure('force-push', 'not_found', id, atlasId, updateResult.error, db, logger)
        } catch (e) {
          logger.warn(
            {
              error: e,
              entityId: id,
              atlasId,
            },
            'The ATLAS not-found outcome could not be persisted.',
          )
        }

        return {
          success: false,
          code: 'notFound',
          message: 'Remote entity not found.',
        }
      }

      // This actually should be impossible with `conflictPolicy = 'overwrite'`
      if (updateResult.code === 'conflict') {
        return {
          success: false,
          code: 'unexpected',
          message: 'ATLAS unexpectedly reported a conflict during a forced update.',
        }
      }

      try {
        await finalizeEntitySyncSuccess('force-push', id, updateResult.cluster.atlasId, db, logger)
      } catch (error) {
        logger.error(
          {
            error,
            entityId: id,
            atlasId: updateResult.cluster.atlasId,
          },
          'ATLAS was updated, but local synchronization could not be finalized.',
        )

        return {
          success: false,
          code: 'unexpected',
          message: 'ATLAS was updated, but the local synchronization state could not be saved.',
          error: error as Error,
        }
      }

      return {
        success: true,
        data: {
          code: 'synced',
          entityId: id,
          atlasId: updateResult.cluster.atlasId,
        },
      }
    }
  }
}
