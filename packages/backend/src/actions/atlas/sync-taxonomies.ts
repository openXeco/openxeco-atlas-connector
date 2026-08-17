import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import type { getAtlasClient } from '@/actions/atlas/atlas-client.js'
import { TAXONOMY_TYPES } from '@/config/constants.js'
import { wait } from '@/actions/atlas/common.js'
import { syncTaxonomiesByType } from '@/actions/atlas/sync-taxonomies-by-type.js'

export const syncTaxonomies = async ({
  db,
  logger,
  dependencies: { atlasClient },
}: ActionArgsWithDb<undefined, { atlasClient: ReturnType<typeof getAtlasClient> }>): Promise<
  ActionResult<{ success: number; failed: number }>
> => {
  logger.info('Starting atlas sync taxonomies.')

  let success = 0
  let failed = 0

  for (let i = 0; i < TAXONOMY_TYPES.length; i++) {
    const type = TAXONOMY_TYPES[i]

    try {
      await syncTaxonomiesByType({ logger, db, dependencies: { atlasClient }, data: { type } })
      success++
    } catch (e) {
      logger.warn(e, `Failed to sync taxonomy type: ${type}`)
      failed++
    }

    if (i < TAXONOMY_TYPES.length - 1) {
      await wait(2000)
    }
  }

  return {
    success: true,
    data: {
      success,
      failed,
    },
  }
}
