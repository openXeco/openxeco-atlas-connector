import type {
  AtlasClient,
  AtlasClusterInput,
  UpdateAtlasEntityResult,
  AtlasCluster,
  AtlasJsonApiResource,
} from '@/actions/atlas/types.js'
import { getClusterByID, wasClusterRemotelyModified } from '@/actions/atlas/utils/atlas-clusters.js'
import { AtlasApiError } from '@/actions/atlas/utils/atlas-api-error.js'
import { findConflictFields } from '@/actions/atlas/utils/conflicts.js'
import { toPatchResourceFromCluster, toClusterFromResource } from '@/actions/atlas/utils/transformers.js'

type UpdateRemoteEntityArgs = {
  atlasId: string
  input: AtlasClusterInput
  lastSyncedAt: Date | null
  atlasClient: AtlasClient
}

export const updateRemoteEntity = async ({
  atlasId,
  input,
  lastSyncedAt,
  atlasClient,
}: UpdateRemoteEntityArgs): Promise<UpdateAtlasEntityResult> => {
  let remote: AtlasCluster

  try {
    remote = await getClusterByID(atlasId, atlasClient)
  } catch (e) {
    if (e instanceof AtlasApiError && e.status === 404) {
      return {
        code: 'not_found',
        atlasId,
      }
    }

    throw e
  }

  if (wasClusterRemotelyModified(lastSyncedAt, remote.updatedAt)) {
    const conflictFields = findConflictFields(input, remote)

    if (conflictFields.length > 0) {
      return {
        code: 'conflict',
        atlasId,
        conflictFields,
      }
    }
  }

  const patchResource = toPatchResourceFromCluster(input, remote, atlasId)

  if (Object.keys(patchResource.attributes).length === 0 && !patchResource.relationships) {
    return {
      code: 'updated',
      cluster: remote,
    }
  }

  try {
    const response = await atlasClient.patch<AtlasJsonApiResource>(`/node/cluster/${atlasId}`, {
      body: {
        data: patchResource,
      },
    })

    if (!response.data) {
      throw new Error('ATLAS did not return the updated entity.')
    }

    return {
      code: 'updated',
      cluster: toClusterFromResource(response.data),
    }
  } catch (e) {
    if (e instanceof AtlasApiError && e.status === 404) {
      return {
        code: 'not_found',
        atlasId,
      }
    }

    throw e
  }
}
