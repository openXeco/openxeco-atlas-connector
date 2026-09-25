import type { AtlasClient } from '@/actions/atlas/types.js'
import { getClustersByRegistrationCode } from '@/actions/atlas/utils/atlas-clusters.js'
import { getEntitiesIdWithAtlasId } from '@/actions/entities/common.js'
import type { DB, Logger } from '@/types.js'

export const findCorrespondences = async (
  registrationNumber: string,
  atlasClient: AtlasClient,
  db: DB,
  logger: Logger,
) => {
  const excludedIds = await getEntitiesIdWithAtlasId(db)

  return getClustersByRegistrationCode(registrationNumber, excludedIds, atlasClient, db, logger)
}
