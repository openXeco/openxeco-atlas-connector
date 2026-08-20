import type { AtlasClient } from '@/actions/atlas/types.js'
import { getClustersByRegistrationCode } from '@/actions/atlas/utils/atlas-clusters.js'
import { getEntitiesIdWithAtlasId } from '@/actions/entities/common.js'
import type { DB } from '@/types.js'

export const findCorrespondences = async (registrationNumber: string, atlasClient: AtlasClient, db: DB) => {
  const excludedIds = await getEntitiesIdWithAtlasId(db)

  return await getClustersByRegistrationCode(registrationNumber, excludedIds, atlasClient)
}
