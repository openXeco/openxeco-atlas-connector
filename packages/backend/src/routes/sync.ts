import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, desc, and, gte, lte, count } from 'drizzle-orm'
import { db } from '../config/database.js'
import { syncLogs, entities } from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { entitySyncService } from '../services/sync/entity-sync.js'

const resolveConflictSchema = z.object({
  resolution: z.enum(['local', 'remote']),
})

const batchSyncSchema = z.object({
  entityIds: z.array(z.string().uuid()).optional(),
  atlasIds: z.array(z.string()).optional(),
})

export async function syncRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/entities/:id/push', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = request.currentUser?.userId

      const result = await entitySyncService.pushEntity(id, userId)

      if (!result.success) {
        return reply.status(result.error === 'CONFLICT' ? 409 : 500).send({
          error: result.error || 'Sync Failed',
          message: result.message,
        })
      }

      return reply.send({
        data: result,
        message: result.message,
      })
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to push entity',
      })
    }
  })

  fastify.post('/entities/:id/pull', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = request.currentUser?.userId

      const [entity] = await db.select().from(entities).where(eq(entities.id, id)).limit(1)

      if (!entity || !entity.atlasId) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Entity not found or not synced to ATLAS',
        })
      }

      const result = await entitySyncService.pullEntity(entity.atlasId, userId)

      if (!result.success) {
        return reply.status(result.error === 'CONFLICT' ? 409 : 500).send({
          error: result.error || 'Sync Failed',
          message: result.message,
        })
      }

      return reply.send({
        data: result,
        message: result.message,
      })
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to pull entity',
      })
    }
  })

  fastify.get('/entities/:id/diff', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const diffs = await entitySyncService.getDiff(id)

      return reply.send({
        data: diffs,
        meta: {
          totalFields: diffs.length,
          differentFields: diffs.filter((d) => d.isDifferent).length,
        },
      })
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get diff',
      })
    }
  })

  fastify.get('/entities/:id/conflicts', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const conflict = await entitySyncService.detectConflicts(id)

      return reply.send({
        data: conflict,
      })
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to detect conflicts',
      })
    }
  })

  fastify.post('/entities/:id/resolve', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = resolveConflictSchema.parse(request.body)
      const userId = request.currentUser?.userId

      const result = await entitySyncService.resolveConflict(id, body.resolution, userId)

      if (!result.success) {
        return reply.status(500).send({
          error: 'Resolution Failed',
          message: result.message,
        })
      }

      return reply.send({
        data: result,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors,
        })
      }
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to resolve conflict',
      })
    }
  })

  fastify.post('/batch/push', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = batchSyncSchema.parse(request.body)
      const userId = request.currentUser?.userId

      if (!body.entityIds || body.entityIds.length === 0) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'entityIds array is required and must not be empty',
        })
      }

      const result = await entitySyncService.pushBatch(body.entityIds, userId)

      return reply.send({
        data: result,
        message: `Batch push completed: ${result.success} succeeded, ${result.failed} failed`,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors,
        })
      }
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to push batch',
      })
    }
  })

  fastify.post('/batch/pull', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = batchSyncSchema.parse(request.body)
      const userId = request.currentUser?.userId

      if (!body.atlasIds || body.atlasIds.length === 0) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'atlasIds array is required and must not be empty',
        })
      }

      const result = await entitySyncService.pullBatch(body.atlasIds, userId)

      return reply.send({
        data: result,
        message: `Batch pull completed: ${result.success} succeeded, ${result.failed} failed`,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors,
        })
      }
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to pull batch',
      })
    }
  })

  fastify.get('/status', { preHandler: authenticate }, async (_request, reply) => {
    try {
      const rows = await db
        .select({
          syncStatus: entities.syncStatus,
          count: count(),
        })
        .from(entities)
        .groupBy(entities.syncStatus)

      const counts: Record<string, number> = {}
      let total = 0
      for (const row of rows) {
        counts[row.syncStatus || 'local'] = row.count
        total += row.count
      }

      const local = counts['local'] || 0
      const conflict = counts['conflict'] || 0

      return reply.send({
        data: {
          total,
          local,
          synced: counts['synced'] || 0,
          conflict,
          failed: counts['failed'] || 0,
          pendingPush: local + conflict,
        },
      })
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get sync status',
      })
    }
  })

  fastify.get('/logs', { preHandler: authenticate }, async (request, reply) => {
    try {
      const {
        page = 1,
        limit = 20,
        entityId,
        operation,
        status,
        startDate,
        endDate,
      } = request.query as {
        page?: number
        limit?: number
        entityId?: string
        operation?: string
        status?: string
        startDate?: string
        endDate?: string
      }

      const offset = (Number(page) - 1) * Number(limit)

      let query = db.select().from(syncLogs)

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

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any
      }

      const logs = await query.limit(Number(limit)).offset(offset).orderBy(desc(syncLogs.createdAt))

      return reply.send({
        data: logs,
        meta: {
          page: Number(page),
          limit: Number(limit),
          count: logs.length,
        },
      })
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch sync logs',
      })
    }
  })
}
