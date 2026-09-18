import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { syncLogs, type SyncLog } from '@/db/schema.js'
import type { ActionArgsWithDb, ActionResult, PaginatedResult } from '@/types.js'
import type { SyncLogsQuery } from '@/actions/atlas/types.js'

import { z } from 'zod'
import { syncLogOperationSchema } from '@/config/constants.js'

export const syncLogsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    entityId: z.string().uuid().optional(),
    operation: syncLogOperationSchema.optional(),
    status: z.enum(['synced', 'failed']).optional(),
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate: z.string().datetime({ offset: true }).optional(),
  })
  .refine(({ startDate, endDate }) => !startDate || !endDate || new Date(startDate) <= new Date(endDate), {
    message: 'End date must be on or after start date.',
    path: ['endDate'],
  })

export const getSyncLogs = async ({
  data: { page, limit, entityId, operation, status, startDate, endDate },
  db,
  logger,
}: ActionArgsWithDb<SyncLogsQuery>): Promise<ActionResult<PaginatedResult<SyncLog>>> => {
  try {
    const conditions = []

    if (entityId) {
      conditions.push(eq(syncLogs.entityId, entityId))
    }

    if (operation) {
      conditions.push(eq(syncLogs.operation, operation))
    }

    if (status) {
      conditions.push(eq(syncLogs.status, status))
    }

    if (startDate) {
      conditions.push(gte(syncLogs.createdAt, new Date(startDate)))
    }

    if (endDate) {
      conditions.push(lte(syncLogs.createdAt, new Date(endDate)))
    }

    const whereClause = and(...conditions)
    const [logs, [{ total }]] = await Promise.all([
      db
        .select()
        .from(syncLogs)
        .where(whereClause)
        .orderBy(desc(syncLogs.createdAt), desc(syncLogs.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(syncLogs).where(whereClause),
    ])

    return {
      success: true,
      data: {
        data: logs,
        meta: { page, limit, count: logs.length, total },
      },
    }
  } catch (error) {
    logger.error({ error }, 'Unable to retrieve synchronization logs.')
    return {
      success: false,
      code: 'unexpected',
      message: 'Unable to retrieve synchronization logs.',
    }
  }
}
