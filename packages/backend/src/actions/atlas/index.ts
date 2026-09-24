import type { ActionArgsWithDb, TaxonomyType, DB } from '@/types.js'
import { getTaxonomies } from '@/actions/atlas/get-taxonomies.js'
import { getAtlasClient } from '@/actions/atlas/atlas-client.js'
import { config } from '@/config/index.js'
import { handleActionResult } from '@/utils/action-helpers.js'
import { syncTaxonomiesByType } from '@/actions/atlas/sync-taxonomies-by-type.js'
import { syncTaxonomies } from '@/actions/atlas/sync-taxonomies.js'
import { getCluster } from '@/actions/atlas/get-cluster.js'
import { pushEntity } from '@/actions/atlas/push-entity.js'
import { selectCorrespondence } from '@/actions/atlas/select-correspondence.js'
import { forceCreateEntity } from '@/actions/atlas/force-create-entity.js'
import { forceSyncEntity } from '@/actions/atlas/force-sync-entity.js'
import { getSyncLogs } from '@/actions/atlas/get-sync-logs.js'
import type { SyncLogsQuery } from '@/actions/atlas/types.js'
import { checkConflicts } from '@/actions/atlas/check-conflicts.js'

export const atlasActions = (db: DB, logger: ActionArgsWithDb['logger']) => {
  const atlasClient = getAtlasClient({ appConfig: config, logger })

  return {
    getSyncLogs: async (query: SyncLogsQuery) => handleActionResult(await getSyncLogs({ data: query, db, logger })),
    getTaxonomies: async (type: TaxonomyType) =>
      handleActionResult(await getTaxonomies({ logger, dependencies: { atlasClient }, data: { type } })),
    syncTaxonomies: async () => handleActionResult(await syncTaxonomies({ db, logger, dependencies: { atlasClient } })),
    syncTaxonomiesByType: async (type: TaxonomyType) =>
      handleActionResult(await syncTaxonomiesByType({ db, logger, dependencies: { atlasClient }, data: { type } })),
    getCluster: async (atlasId: string) =>
      handleActionResult(await getCluster({ logger, dependencies: { atlasClient }, id: atlasId })),
    pushEntity: async (id: string) =>
      handleActionResult(await pushEntity({ db, logger, dependencies: { atlasClient }, id })),
    selectCorrespondence: async (id: string, atlasId: string) =>
      handleActionResult(
        await selectCorrespondence({
          db,
          logger,
          dependencies: { atlasClient },
          id,
          data: { atlasId },
        }),
      ),
    forceCreateEntity: async (id: string) =>
      handleActionResult(await forceCreateEntity({ db, logger, dependencies: { atlasClient }, id })),
    forcePushEntity: async (id: string) =>
      handleActionResult(await forceSyncEntity({ db, logger, dependencies: { atlasClient }, id }, 'push')),
    forcePullEntity: async (id: string) =>
      handleActionResult(await forceSyncEntity({ db, logger, dependencies: { atlasClient }, id }, 'pull')),
    checkConflicts: async (id: string) =>
      handleActionResult(await checkConflicts({ db, logger, dependencies: { atlasClient }, id })),
  }
}
