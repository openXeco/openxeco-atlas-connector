import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { AtlasActionDependencies, ForceCreateEntityResult } from '@/actions/atlas/types.js'
import { createRemoteEntity } from '@/actions/atlas/internal/create-remote-entity.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { toClusterInputFromEntity } from '@/actions/atlas/utils/transformers.js'
import {
  canEntityBePushed,
  markEntityAsFailedSync,
  markEntityAsPendingPush,
  markEntityAsSynced,
} from '@/actions/entities/common.js'
import { getEntity } from '@/actions/entities/get-entity.js'

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

      return {
        success: true,
        data: {
          code: 'already_linked',
          entityId: id,
          atlasId: entity.atlasId,
        },
      }
    } catch (error) {
      if (!(error instanceof AtlasApiError && error.status === 404)) {
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

  try {
    return await db.transaction(async (tx) => {
      await markEntityAsPendingPush(id, tx, logger)
      const created = await createRemoteEntity({ input, atlasClient })
      await markEntityAsSynced(id, created.atlasId, tx, logger)

      return {
        success: true,
        data: {
          code: 'synced',
          operation: 'created',
          entityId: id,
          atlasId: created.atlasId,
        },
      }
    })
  } catch (error) {
    await markEntityAsFailedSync(id, db, logger)

    return {
      success: false,
      code: 'external',
      message: `Unable to create entity ${id} in ATLAS.`,
      error: error as Error,
    }
  }
}
