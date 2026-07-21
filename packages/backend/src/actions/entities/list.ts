import type { ListQuery } from '@/actions/entities/common.js'
import { eq, and, desc } from 'drizzle-orm'
import { entities } from '@/db/schema.js'
import { db } from '@/config/database.js'
import { count as countFn } from 'drizzle-orm/sql/functions/aggregate'
import { atlasClient } from '@/services/atlas/client.js'

export const getEntities = async ({ page, limit, status, syncStatus, fetchRemote }: ListQuery) => {
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

  if (fetchRemote) {
    const syncedEntities = results.filter((e) => !!e.atlasId)

    if (syncedEntities.length > 0) {
      const remoteEntities = await getRemoteEntities(syncedEntities.map((e) => e.atlasId as string))
      remoteEntities.forEach((r) => {
        results.find((e) => e.atlasId === r.atlasId)
      })
    }
  }

  return {
    data: results,
    meta: {
      page,
      limit,
      count: results.length,
      total,
    },
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
