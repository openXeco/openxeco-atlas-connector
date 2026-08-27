import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { AtlasActionDependencies, ForcePullEntityResult, AtlasCluster } from '@/actions/atlas/types.js'
import { replaceLocalEntityFromAtlas } from '@/actions/atlas/internal/replace-local-entity-from-atlas.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { getEntity } from '@/actions/entities/get-entity.js'
import { finalizeEntitySyncFailure, finalizeEntitySyncSuccess } from '@/actions/atlas/internal/finalize-entity-sync.js'

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
  let remote: AtlasCluster

  try {
    remote = await getClusterByID(atlasId, atlasClient)
  } catch (error) {
    if (error instanceof AtlasApiError && error.status === 404) {
      await finalizeEntitySyncFailure('force-pull', 'not_found', id, atlasId, db, logger)

      return {
        success: false,
        code: 'notFound',
        message: `Remote entity ${atlasId} not found.`,
      }
    }

    await finalizeEntitySyncFailure('force-pull', 'failed', id, atlasId, db, logger)

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
      await finalizeEntitySyncSuccess('force-pull', id, atlasId, db, logger)

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
