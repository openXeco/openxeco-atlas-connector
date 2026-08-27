import type {
  PushEntityResult,
  AtlasActionDependencies,
  AtlasClusterInput,
  AtlasClient,
  UpdateAtlasEntityResult,
  AtlasCluster,
} from '@/actions/atlas/types.js'
import type { ActionResult, ActionArgsWithDb, DB, Logger } from '@/types.js'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { canEntityBePushed } from '@/actions/entities/common.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { createRemoteEntity } from '@/actions/atlas/internal/create-remote-entity.js'
import { findCorrespondences } from '@/actions/atlas/internal/find-correspondences.js'
import {
  finalizeEntitySyncConflict,
  finalizeEntitySyncSuccess,
  finalizeEntitySyncFailure,
} from '@/actions/atlas/internal/finalize-entity-sync.js'

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
    let updateResult: UpdateAtlasEntityResult

    try {
      logger.debug('Entity has already an `atlasId`. Switching to update branch.')

      updateResult = await updateRemoteEntity({
        atlasId: entity.atlasId,
        atlasClient,
        lastSyncedAt: entity.lastSyncedAt,
        input: toClusterInputFromEntity(entity),
      })
    } catch (error) {
      // This error indicates that the update was successful but there was an unexpected
      // error somewhere
      return {
        success: false,
        code: 'unexpected',
        message: (error as Error).message,
      }
    }

    switch (updateResult.code) {
      case 'conflict':
        try {
          await finalizeEntitySyncConflict('update', id, updateResult.atlasId, updateResult.conflictFields, db, logger)

          return {
            success: false,
            code: 'conflict',
            message: `Entity with id ${entity.id} has conflicts that should be fixed.`,
          }
        } catch (error) {
          logger.error({ error }, 'Unexpected error when trying to finalize Entity Sync conflict.')
          return {
            success: false,
            code: 'unexpected',
            message: (error as Error).message,
          }
        }

      case 'updated':
        try {
          await finalizeEntitySyncSuccess('update', id, updateResult.cluster.atlasId, db, logger)

          return {
            success: true,
            data: {
              code: 'synced',
              operation: 'updated',
              entityId: entity.id,
              atlasId: updateResult.cluster.atlasId,
            },
          }
        } catch (error) {
          logger.error({ error }, 'ATLAS entity was updated but error when finalizing sync success.')
          return {
            success: false,
            code: 'unexpected',
            message: (error as Error).message,
          }
        }

      case 'not_found':
        // Do not change the previous sync state, continue with correspondence
        break
    }
  }

  const registrationNumber = entity.registrationNumber?.trim()

  if (!registrationNumber) {
    return _createEntity(id, toClusterInputFromEntity(entity), atlasClient, db, logger)
  }

  // Search for eventual correspondences
  try {
    const correspondences = await findCorrespondences(registrationNumber, atlasClient, db)

    if (!correspondences.length) {
      return _createEntity(id, toClusterInputFromEntity(entity), atlasClient, db, logger)
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
}

const _createEntity = async (
  id: string,
  input: AtlasClusterInput,
  atlasClient: AtlasClient,
  db: DB,
  logger: Logger,
): Promise<ActionResult<PushEntityResult>> => {
  let createResult: AtlasCluster

  try {
    createResult = await createRemoteEntity({
      input,
      atlasClient,
    })
  } catch (error) {
    try {
      await finalizeEntitySyncFailure('create', 'failed', id, undefined, db, logger)
    } catch (e) {
      logger.warn({ error: e, entityId: id }, 'Unexpected error when saving sync failure log.')
    }

    return {
      success: false,
      code: 'unexpected',
      message: `Unable to push the entity ${id}`,
      error: error as Error,
    }
  }

  try {
    await finalizeEntitySyncSuccess('create', id, createResult.atlasId, db, logger)
  } catch (e) {
    logger.error({ error: e, entityId: id }, 'Unexpected error when saving sync failure log.')
    return {
      success: false,
      code: 'unexpected',
      message: 'Unable to persist sync log.',
      error: e as Error,
    }
  }

  return {
    success: true,
    data: {
      code: 'synced',
      operation: 'created',
      entityId: id,
      atlasId: createResult.atlasId,
    },
  }
}
