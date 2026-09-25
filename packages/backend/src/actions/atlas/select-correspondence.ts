import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { AtlasActionDependencies, SelectCorrespondenceResult } from '@/actions/atlas/types.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { isAtlasIdLinkedToEntity } from '@/actions/entities/common.js'
import { entities } from '@/db/schema.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { eq } from 'drizzle-orm'

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

  if (await isAtlasIdLinkedToEntity(atlasId, db)) {
    return {
      success: false,
      code: 'validation',
      message: `Entity with atlasId ${atlasId} was already linked.`,
    }
  }

  try {
    await getClusterByID(atlasId, atlasClient)
  } catch (error) {
    if (error instanceof AtlasApiError && error.status === 404) {
      return {
        success: false,
        code: 'notFound',
        message: `Remote entity ${atlasId} not found.`,
      }
    }

    return {
      success: false,
      code: 'external',
      message: `Error occurred. ${(error as Error).message}`,
    }
  }

  try {
    await db
      .update(entities)
      .set({
        atlasId,
        syncStatus: 'pending_push',
        syncCode: null,
        updatedAt: new Date(),
        lastSyncedAt: null,
      })
      .where(eq(entities.id, id))

    return {
      success: true,
      data: {
        code: 'selected',
        entityId: id,
        atlasId,
      },
    }
  } catch (e) {
    logger.error({ error: e, entityId: id, atlasId }, 'Unexpected error when selecting correspondence.')
    return {
      success: false,
      code: 'unexpected',
      message: `Unexpected error when selecting correspondence. ${(e as Error).message}`,
    }
  }
}
