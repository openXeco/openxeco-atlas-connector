import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { AtlasActionDependencies, ForcePushEntityResult, UpdateAtlasEntityResult } from '@/actions/atlas/types.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { finalizeEntitySyncFailure, finalizeEntitySyncSuccess } from '@/actions/atlas/internal/finalize-entity-sync.js'

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
      success: false,
      code: 'validation',
      message: `The entity ${id} is not linked with any ATLAS counterpart.`,
    }
  }

  if (entity.syncStatus !== 'failed' || entity.syncCode !== 'conflict') {
    return {
      success: false,
      code: 'validation',
      message: `The entity ${id} has not conflicts to resolve.`,
    }
  }

  const atlasId = entity.atlasId
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
      await finalizeEntitySyncFailure('force-push', 'not_found', id, atlasId, db, logger)
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
    await finalizeEntitySyncSuccess('force-push', id, atlasId, db, logger)
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
