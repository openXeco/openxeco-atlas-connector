import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { db } from '../config/database.js'
import { syncLogs, entities } from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
import { entitySyncService } from '../services/sync/entity-sync.js'
import { sendErrorReply, handleRouteError, getErrorReply } from '@/utils/reply-helpers.js'
import { taxonomyTypeSchema } from '@/config/constants.js'
import { atlasActions } from '@/actions/atlas/index.js'

export const idParamSchema = z.object({ id: z.string().uuid() })

const selectCorrespondenceSchema = z.object({
  atlasId: z.string().min(1),
})

const resolveConflictSchema = z.object({
  resolution: z.enum(['local', 'remote']),
})

const batchSyncSchema = z.object({
  entityIds: z.array(z.string().uuid()).optional(),
  atlasIds: z.array(z.string()).optional(),
})

const syncLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityId: z.string().uuid().optional(),
  operation: z.enum(['push', 'pull', 'sync']).optional(),
  status: z.enum(['success', 'failed']).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
})

export async function syncRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = atlasActions(db, fastify.log)

  // New endpoints
  fastify.post('/taxonomies/:type', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { type } = request.params as { type: string }

      const validatedType = taxonomyTypeSchema.parse(type)

      const result = await actions.syncTaxonomiesByType(validatedType)

      return reply.send({
        message: `Synced ${result.data} terms for taxonomy type: ${type}`,
        count: result.data,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/taxonomies', { preHandler: authenticate }, async (_request, reply) => {
    try {
      const result = await actions.syncTaxonomies()

      return reply.send({
        message: 'Taxonomy sync completed',
        data: result.data,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/entities/:id/push', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      await actions.pushEntity(id)
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/entities/:id/correspondences', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const { atlasId } = selectCorrespondenceSchema.parse(request.body)
      const result = await actions.selectCorrespondence(id, atlasId)

      return reply.send({
        data: result.data,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/entities/:id/correspondences/create', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const result = await actions.forceCreateEntity(id)

      return reply.send({
        data: result.data,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/entities/:id/force-push', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const result = await actions.forcePushEntity(id)

      return reply.send({
        data: result.data,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/entities/:id/force-pull', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const result = await actions.forcePullEntity(id)

      return reply.send({
        data: result.data,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  // Old endpoints
  // fastify.post('/entities/:id/push', { preHandler: authenticate }, async (request, reply) => {
  //   try {
  //     const { id } = idParamSchema.parse(request.params)
  //     const userId = request.currentUser?.userId
  //
  //     const result = await entitySyncService.pushEntity(id, userId)
  //
  //     if (!result.success) {
  //       return sendErrorReply(
  //         getErrorReply({
  //           type: result.error === 'CONFLICT' ? 'conflict' : 'unexpected',
  //           message: result.message,
  //         }),
  //         reply,
  //       )
  //     }
  //
  //     return reply.send({
  //       data: result,
  //       message: result.message,
  //     })
  //   } catch (error) {
  //     return handleRouteError(error, reply, fastify.log)
  //   }
  // })

  fastify.post('/entities/:id/pull', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)

      const [entity] = await db.select().from(entities).where(eq(entities.id, id)).limit(1)

      if (!entity?.atlasId) {
        return sendErrorReply(
          getErrorReply({ type: 'notFound', message: 'Entity not found or not synced to ATLAS' }),
          reply,
        )
      }

      const result = await entitySyncService.pullEntity(entity.atlasId)

      if (!result.success) {
        return sendErrorReply(
          getErrorReply({
            type: result.error === 'CONFLICT' ? 'conflict' : 'unexpected',
            message: result.message,
          }),
          reply,
        )
      }

      return reply.send({
        data: result,
        message: result.message,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.get('/entities/:id/diff', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)

      const diffs = await entitySyncService.getDiff(id)

      return reply.send({
        data: diffs,
        meta: {
          totalFields: diffs.length,
          differentFields: diffs.filter((d) => d.isDifferent).length,
        },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.get('/entities/:id/conflicts', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)

      const conflict = await entitySyncService.detectConflicts(id)

      return reply.send({
        data: conflict,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/entities/:id/resolve', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const body = resolveConflictSchema.parse(request.body)
      const userId = request.currentUser?.userId

      const result = await entitySyncService.resolveConflict(id, body.resolution, userId)

      if (!result.success) {
        return sendErrorReply(getErrorReply({ type: 'unexpected', message: result.message }), reply)
      }

      return reply.send({
        data: result,
        message: result.message,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/batch/push', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = batchSyncSchema.parse(request.body)
      const userId = request.currentUser?.userId

      if (!body.entityIds || body.entityIds.length === 0) {
        return sendErrorReply(
          getErrorReply({
            type: 'badRequest',
            message: 'entityIds array is required and must not be empty',
          }),
          reply,
        )
      }

      const result = await entitySyncService.pushBatch(body.entityIds, userId)

      return reply.send({
        data: result,
        message: `Batch push completed: ${result.success} succeeded, ${result.failed} failed`,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/batch/pull', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = batchSyncSchema.parse(request.body)

      if (!body.atlasIds || body.atlasIds.length === 0) {
        return sendErrorReply(
          getErrorReply({
            type: 'badRequest',
            message: 'atlasIds array is required and must not be empty',
          }),
          reply,
        )
      }

      const result = await entitySyncService.pullBatch(body.atlasIds)

      return reply.send({
        data: result,
        message: `Batch pull completed: ${result.success} succeeded, ${result.failed} failed`,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.get('/logs', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { page, limit, entityId, operation, status, startDate, endDate } = syncLogsQuerySchema.parse(request.query)

      const offset = (page - 1) * limit

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
        // biome-ignore lint/suspicious/noExplicitAny: Drizzle-orm magic
        query = query.where(and(...conditions)) as any
      }

      const logs = await query.limit(limit).offset(offset).orderBy(desc(syncLogs.createdAt))

      return reply.send({
        data: logs,
        meta: {
          page,
          limit,
          count: logs.length,
        },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.delete('/logs/cleanup', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { retentionDays = 90 } = request.query as { retentionDays?: number }
      const days = Math.max(1, Math.min(Number(retentionDays), 365))

      const deleted = await entitySyncService.cleanupSyncLogs(days)

      return reply.send({
        message: `Deleted ${deleted} sync log entries older than ${days} days`,
        deleted,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })
}
