import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { AtlasActionDependencies, ForcePullEntityResult } from '@/actions/atlas/types.js'
import { replaceLocalEntityFromAtlas } from '@/actions/atlas/internal/replace-local-entity-from-atlas.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { markEntityAsFailedSync, markEntityAsNotFound } from '@/actions/entities/common.js'

export const forcePullEntity = async ({
  id,
  db,
  logger,
  dependencies: { atlasClient },
}: ActionArgsWithDb<undefined, AtlasActionDependencies>): Promise<ActionResult<ForcePullEntityResult>> => {
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

  try {
    const remote = await getClusterByID(atlasId, atlasClient)
    await replaceLocalEntityFromAtlas(id, remote, db)

    return {
      success: true,
      data: {
        code: 'synced',
        entityId: id,
        atlasId,
      },
    }
  } catch (error) {
    if (error instanceof AtlasApiError && error.status === 404) {
      await markEntityAsNotFound(id, db, logger)

      return {
        success: true,
        data: {
          code: 'remote_not_found',
          entityId: id,
          atlasId,
        },
      }
    }

    await markEntityAsFailedSync(id, db, logger)

    return {
      success: false,
      code: 'external',
      message: `Unable to force pull entity ${id} from ATLAS.`,
      error: error as Error,
    }
  }
}
