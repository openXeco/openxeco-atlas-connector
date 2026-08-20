import type { BaseActionArgs, ActionResult } from '@/types.js'
import type { AtlasCluster, AtlasActionDependencies } from '@/actions/atlas/types.js'
import { getClusterByID } from '@/actions/atlas/utils/atlas-clusters.js'

export const getCluster = async ({
  dependencies: { atlasClient },
  id,
}: BaseActionArgs<undefined, AtlasActionDependencies>): Promise<ActionResult<AtlasCluster>> => {
  if (!id) {
    return {
      success: false,
      code: 'validation',
      message: 'Entity id is required.',
    }
  }

  try {
    const cluster = await getClusterByID(id, atlasClient)

    return {
      success: true,
      data: cluster,
    }
  } catch (e) {
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
      error: e as Error,
    }
  }
}
