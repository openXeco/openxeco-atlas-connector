import type { ActionArgsWithDb, ActionResult, SyncStatus, EntityStatus } from '@/types.js'
import type { EntitiesStatusRecap } from '@/actions/entities/types.js'
import { entities } from '@/db/schema.js'
import { count } from 'drizzle-orm'

export const getStatusRecap = async ({ db }: ActionArgsWithDb): Promise<ActionResult<EntitiesStatusRecap>> => {
  try {
    const [syncRows, moderationRows] = await Promise.all([
      db.select({ syncStatus: entities.syncStatus, count: count() }).from(entities).groupBy(entities.syncStatus),
      db.select({ status: entities.status, count: count() }).from(entities).groupBy(entities.status),
    ])

    const syncMap = new Map<SyncStatus, number>()
    const moderationMap = new Map<EntityStatus, number>()
    let total = 0

    for (const r of syncRows) {
      syncMap.set(r.syncStatus, r.count)
    }

    for (const r of moderationRows) {
      moderationMap.set(r.status, r.count)
      total++
    }

    return {
      success: true,
      data: {
        total,
        moderation: {
          ...(Object.fromEntries(moderationMap) as EntitiesStatusRecap['moderation']),
        },
        sync: {
          ...(Object.fromEntries(syncMap) as EntitiesStatusRecap['sync']),
        },
      },
    }
  } catch (e) {
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
    }
  }
}
