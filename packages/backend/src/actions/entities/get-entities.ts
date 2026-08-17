import type { ListQuery } from '@/actions/entities/common.js'
import { eq, and, desc } from 'drizzle-orm'
import { entities, type Entity } from '@/db/schema.js'
import { count as countFn } from 'drizzle-orm/sql/functions/aggregate'
import { atlasClient } from '@/services/atlas/client.js'

import type { ActionArgsWithDb, ActionResult, PaginatedResult } from '@/types.js'

export const getEntities = async ({
  data: { page, limit, status, syncStatus },
  db,
}: ActionArgsWithDb<ListQuery>): Promise<ActionResult<PaginatedResult<Entity>>> => {
  try {
    const offset = (page - 1) * limit

    const conditions = []

    if (status) {
      conditions.push(eq(entities.status, status))
    }

    if (syncStatus) {
      conditions.push(eq(entities.syncStatus, syncStatus))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [results, [{ total }]] = await Promise.all([
      db.select().from(entities).where(whereClause).limit(limit).offset(offset).orderBy(desc(entities.createdAt)),
      db.select({ total: countFn() }).from(entities).where(whereClause),
    ])

    return {
      success: true,
      data: {
        data: results,
        meta: {
          page,
          limit,
          count: results.length,
          total,
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

export const getRemoteEntities = async (atlasIds: string[]) => {
  const remoteEntities = await atlasClient.getClusters({
    filter: {
      id: {
        condition: {
          path: 'id',
          operator: 'IN',
          value: atlasIds,
        },
      },
    },
  })
  return remoteEntities.data || []
}
