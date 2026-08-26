import type {
  PushEntityResult,
  AtlasActionDependencies,
  AtlasClusterInput,
  AtlasClient,
} from '@/actions/atlas/types.js'
import type { ActionResult, ActionArgsWithDb, DB, Logger } from '@/types.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import {
  markEntityAsConflict,
  markEntityAsSynced,
  canEntityBePushed,
  markEntityAsFailedSync,
} from '@/actions/entities/common.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { createRemoteEntity } from '@/actions/atlas/internal/create-remote-entity.js'
import { findCorrespondences } from '@/actions/atlas/internal/find-correspondences.js'

/**
 * Synchronizes one local entity with ATLAS.
 *
 * This action only orchestrates the workflow:
 *
 * - update an existing ATLAS entity;
 * - recover when a stored atlasId returns 404;
 * - discover possible correspondences;
 * - create automatically when no correspondence exists.
 *
 * Candidate discovery does not change atlasId, syncStatus or syncCode.
 */
export const pushEntity = async ({
  id,
  db,
  logger,
  dependencies: { atlasClient },
}: ActionArgsWithDb<undefined, AtlasActionDependencies>): Promise<ActionResult<PushEntityResult>> => {
  if (!id) {
    return {
      success: false,
      code: 'validation',
      message: 'Entity id is required.',
    }
  }

  try {
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
        message: `Entity with ${id} can't be pushed. Current status: ${entity.syncStatus} - ${entity.syncCode ?? ''}`,
      }
    }

    // If the entity has already `atlasId` it means that it was already pushed to ATLAS at least once
    if (entity.atlasId) {
      logger.debug('Entity has already an `atlasId`. Switching to update branch.')

      const updateResult = await updateRemoteEntity({
        atlasId: entity.atlasId,
        atlasClient,
        lastSyncedAt: entity.lastSyncedAt,
        input: toClusterInputFromEntity(entity),
      })

      switch (updateResult.code) {
        case 'conflict':
          await markEntityAsConflict(entity.id, db, logger, updateResult.conflictFields)

          return {
            success: false,
            code: 'conflict',
            message: `Entity with id ${entity.id} has conflicts that should be fixed.`,
          }

        case 'updated':
          await markEntityAsSynced(entity.id, updateResult.cluster.atlasId, db, logger)

          return {
            success: true,
            data: {
              code: 'synced',
              operation: 'updated',
              entityId: entity.id,
              atlasId: updateResult.cluster.atlasId,
            },
          }

        case 'not_found':
          // Do not change the previous sync state, continue with correspondence
          break
      }
    }

    const registrationNumber = entity.registrationNumber?.trim()

    if (!registrationNumber) {
      return _createEntityWrapper(id, toClusterInputFromEntity(entity), atlasClient, db, logger)
    }

    // Search for eventual correspondences
    try {
      const correspondences = await findCorrespondences(registrationNumber, atlasClient, db)

      if (!correspondences.length) {
        return _createEntityWrapper(id, toClusterInputFromEntity(entity), atlasClient, db, logger)
      }

      return {
        success: true,
        data: {
          code: 'selection_required',
          candidates: correspondences,
          entityId: id,
        },
      }
    } catch (e) {
      logger.error({ error: e, entityId: id }, 'Unexpected error while looking for correspondences.')
      return {
        success: false,
        code: 'unexpected',
        message: `Unexpected error when looking for correspondences with Entity ID ${id}.`,
        error: e as Error,
      }
    }
  } catch (e) {
    logger.error({ error: e, entityId: id }, 'Unexpected error while preparing entity synchronization.')

    await markEntityAsFailedSync(id, db, logger)

    return {
      success: false,
      code: 'unexpected',
      message: 'Unable to push the entity.',
      error: e as Error,
    }
  }
}

const _createEntityWrapper = async (
  id: string,
  input: AtlasClusterInput,
  atlasClient: AtlasClient,
  db: DB,
  logger: Logger,
): Promise<ActionResult<PushEntityResult>> => {
  try {
    const createResult = await createRemoteEntity({
      input,
      atlasClient,
    })

    await markEntityAsSynced(id, createResult.atlasId, db, logger)

    return {
      success: true,
      data: {
        code: 'synced',
        operation: 'created',
        entityId: id,
        atlasId: createResult.atlasId,
      },
    }
  } catch (e) {
    await markEntityAsFailedSync(id, db, logger)

    return {
      success: false,
      code: 'unexpected',
      message: `Unable to push the entity ${id}`,
      error: e as Error,
    }
  }
}
