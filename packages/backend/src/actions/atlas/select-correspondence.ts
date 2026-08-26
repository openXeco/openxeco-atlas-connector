import type { ActionArgsWithDb, ActionResult, DB, Logger } from '@/types.js'
import type { AtlasActionDependencies, SelectCorrespondenceResult } from '@/actions/atlas/types.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { isAtlasIdLinkedToEntity, markEntityAsSynced } from '@/actions/entities/common.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import { entities } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { updateRemoteEntity } from '@/actions/atlas/internal/update-remote-entity.js'

export const linkEntityWithConflict = async (
  id: string,
  atlasId: string,
  _conflictFields: unknown[],
  db: DB,
  logger: Logger,
): Promise<void> => {
  await db
    .update(entities)
    .set({
      atlasId,
      lastSyncedAt: null,
      syncStatus: 'failed',
      syncCode: 'conflict',
      updatedAt: new Date(),
    })
    .where(eq(entities.id, id))

  // TODO: persist conflictFields when conflict resolution is implemented.
  logger.debug('Persisting conflict fields.')
}

export const selectCorrespondence = async ({
  data: { atlasId },
  db,
  logger,
  id,
  dependencies: { atlasClient },
}: ActionArgsWithDb<{ atlasId: string }, AtlasActionDependencies>): Promise<
  ActionResult<SelectCorrespondenceResult>
> => {
  if (!id) {
    return {
      success: false,
      code: 'validation',
      message: 'Entity id is required.',
    }
  }

  const entityResult = await getEntity({
    id,
    db,
    logger,
  })

  if (!entityResult.success) {
    return {
      success: false,
      code: 'notFound',
      message: `Entity with id ${id} was not found.`,
    }
  }

  const entity = entityResult.data

  if (await isAtlasIdLinkedToEntity(atlasId, db)) {
    return {
      success: true,
      data: {
        code: 'already_linked',
        entityId: id,
        atlasId,
      },
    }
  }

  const updateResult = await updateRemoteEntity({
    atlasId,
    input: toClusterInputFromEntity(entity),

    // The previous timestamp belongs to the missing ATLAS entity,
    // not to the newly selected candidate.
    lastSyncedAt: null,

    atlasClient,
  })

  switch (updateResult.code) {
    case 'not_found':
      return {
        success: true,
        data: {
          code: 'candidate_not_found',
          entityId: id,
          atlasId,
        },
      }

    case 'conflict':
      await linkEntityWithConflict(id, atlasId, updateResult.conflictFields, db, logger)

      return {
        success: true,
        data: {
          code: 'conflict',
          entityId: id,
          atlasId,
          conflictFields: updateResult.conflictFields,
        },
      }

    case 'updated':
      await markEntityAsSynced(id, updateResult.cluster.atlasId, db, logger)

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
