import type { AtlasClusterInput, AtlasClient, AtlasJsonApiResource } from '@/actions/atlas/types.js'
import { toResourceFromCluster, toClusterFromResource } from '@/actions/atlas/utils/transformers.js'

type CreateRemoteEntityArgs = {
  input: AtlasClusterInput
  atlasClient: AtlasClient
}
export const createRemoteEntity = async ({ input, atlasClient }: CreateRemoteEntityArgs) => {
  const resource = toResourceFromCluster(input)

  const response = await atlasClient.post<AtlasJsonApiResource>('/node/cluster', {
    body: {
      data: resource,
    },
  })

  if (!response.data) {
    throw new Error('ATLAS did not return the created entity.')
  }

  return toClusterFromResource(response.data)
}
