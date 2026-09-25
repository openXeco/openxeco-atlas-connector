import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { handleRouteError } from '@/utils/reply-helpers.js'
import { taxonomyTypeSchema } from '@/config/constants.js'
import { atlasActions } from '@/actions/atlas/index.js'
import { syncLogsQuerySchema } from '@/actions/atlas/get-sync-logs.js'

export const idParamSchema = z.object({ id: z.string().uuid() })

const selectCorrespondenceSchema = z.object({
  atlasId: z.string().min(1),
})

export async function syncRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = atlasActions(db, fastify.log)

  // New endpoints
  fastify.post(
    '/taxonomies/:type',
    {
      schema: {
        tags: ['sync'],
        description: 'Synchronize taxonomy terms of the specified type from ATLAS.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
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
    },
  )

  fastify.post(
    '/taxonomies',
    {
      schema: {
        tags: ['sync'],
        description: 'Synchronize all supported taxonomy types from ATLAS.',
      },
      preHandler: authenticate,
    },
    async (_request, reply) => {
      try {
        const result = await actions.syncTaxonomies()

        return reply.send({
          message: 'Taxonomy sync completed',
          data: result.data,
        })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.post(
    '/entities/:id/push',
    {
      schema: {
        tags: ['sync'],
        description: 'Push a local entity to ATLAS, checking for conflicts and possible correspondences.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params)
        const result = await actions.pushEntity(id)

        return reply.send({
          data: result.data,
        })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.post(
    '/entities/:id/correspondences',
    {
      schema: {
        tags: ['sync'],
        description: 'Link a local entity to a selected ATLAS entity and mark it as pending push.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
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
    },
  )

  fastify.post(
    '/entities/:id/correspondences/create',
    {
      schema: {
        tags: ['sync'],
        description: 'Create a new ATLAS entity from a local entity instead of selecting an existing correspondence.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params)
        const result = await actions.forceCreateEntity(id)

        return reply.send({
          data: result.data,
        })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.post(
    '/entities/:id/force-push',
    {
      schema: {
        tags: ['sync'],
        description: 'Resolve a synchronization conflict by overwriting the ATLAS entity with local data.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params)
        const result = await actions.forcePushEntity(id)

        return reply.send({
          data: result.data,
        })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.post(
    '/entities/:id/force-pull',
    {
      schema: {
        tags: ['sync'],
        description: 'Resolve a synchronization conflict by replacing local entity data with ATLAS data.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params)
        const result = await actions.forcePullEntity(id)

        return reply.send({
          data: result.data,
        })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.get(
    '/logs',
    {
      schema: {
        tags: ['sync'],
        description:
          'List synchronization logs with pagination and optional entity, operation, status, and date filters.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const query = syncLogsQuerySchema.parse(request.query)
        const result = await actions.getSyncLogs(query)

        return reply.send(result.data)
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.get(
    '/entities/:id/conflicts',
    {
      schema: {
        tags: ['sync'],
        description: 'Fetch the latest ATLAS entity and return remote values for fields that conflict with local data.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params)
        const result = await actions.checkConflicts(id)

        return reply.send(result)
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

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

  // fastify.post(
  //   '/entities/:id/pull',
  //   {
  //     schema: {
  //       tags: ['sync-old'],
  //       description: 'Pull the linked ATLAS entity into the local database with conflict detection.',
  //     },
  //     preHandler: authenticate,
  //   },
  //   async (request, reply) => {
  //     try {
  //       const { id } = idParamSchema.parse(request.params)
  //
  //       const [entity] = await db.select().from(entities).where(eq(entities.id, id)).limit(1)
  //
  //       if (!entity?.atlasId) {
  //         return sendErrorReply(
  //           getErrorReply({ type: 'notFound', message: 'Entity not found or not synced to ATLAS' }),
  //           reply,
  //         )
  //       }
  //
  //       const result = await entitySyncService.pullEntity(entity.atlasId)
  //
  //       if (!result.success) {
  //         return sendErrorReply(
  //           getErrorReply({
  //             type: result.error === 'CONFLICT' ? 'conflict' : 'unexpected',
  //             message: result.message,
  //           }),
  //           reply,
  //         )
  //       }
  //
  //       return reply.send({
  //         data: result,
  //         message: result.message,
  //       })
  //     } catch (error) {
  //       return handleRouteError(error, reply, fastify.log)
  //     }
  //   },
  // )
  //
  // fastify.get(
  //   '/entities/:id/diff',
  //   {
  //     schema: {
  //       tags: ['sync-old'],
  //       description: 'Compare local and ATLAS entity data and return field differences.',
  //     },
  //     preHandler: authenticate,
  //   },
  //   async (request, reply) => {
  //     try {
  //       const { id } = idParamSchema.parse(request.params)
  //
  //       const diffs = await entitySyncService.getDiff(id)
  //
  //       return reply.send({
  //         data: diffs,
  //         meta: {
  //           totalFields: diffs.length,
  //           differentFields: diffs.filter((d) => d.isDifferent).length,
  //         },
  //       })
  //     } catch (error) {
  //       return handleRouteError(error, reply, fastify.log)
  //     }
  //   },
  // )
  //
  // fastify.post(
  //   '/entities/:id/resolve',
  //   {
  //     schema: {
  //       tags: ['sync-old'],
  //       description: 'Resolve an entity synchronization conflict using the local or remote version.',
  //     },
  //     preHandler: authenticate,
  //   },
  //   async (request, reply) => {
  //     try {
  //       const { id } = idParamSchema.parse(request.params)
  //       const body = resolveConflictSchema.parse(request.body)
  //       const userId = request.currentUser?.userId
  //
  //       const result = await entitySyncService.resolveConflict(id, body.resolution, userId)
  //
  //       if (!result.success) {
  //         return sendErrorReply(getErrorReply({ type: 'unexpected', message: result.message }), reply)
  //       }
  //
  //       return reply.send({
  //         data: result,
  //         message: result.message,
  //       })
  //     } catch (error) {
  //       return handleRouteError(error, reply, fastify.log)
  //     }
  //   },
  // )
  //
  // fastify.post(
  //   '/batch/push',
  //   {
  //     schema: {
  //       tags: ['sync-old'],
  //       description: 'Push a batch of local entities to ATLAS.',
  //     },
  //     preHandler: authenticate,
  //   },
  //   async (request, reply) => {
  //     try {
  //       const body = batchSyncSchema.parse(request.body)
  //       const userId = request.currentUser?.userId
  //
  //       if (!body.entityIds || body.entityIds.length === 0) {
  //         return sendErrorReply(
  //           getErrorReply({
  //             type: 'badRequest',
  //             message: 'entityIds array is required and must not be empty',
  //           }),
  //           reply,
  //         )
  //       }
  //
  //       const result = await entitySyncService.pushBatch(body.entityIds, userId)
  //
  //       return reply.send({
  //         data: result,
  //         message: `Batch push completed: ${result.success} succeeded, ${result.failed} failed`,
  //       })
  //     } catch (error) {
  //       return handleRouteError(error, reply, fastify.log)
  //     }
  //   },
  // )
  //
  // fastify.post(
  //   '/batch/pull',
  //   {
  //     schema: {
  //       tags: ['sync-old'],
  //       description: 'Pull a batch of ATLAS entities into the local database.',
  //     },
  //     preHandler: authenticate,
  //   },
  //   async (request, reply) => {
  //     try {
  //       const body = batchSyncSchema.parse(request.body)
  //
  //       if (!body.atlasIds || body.atlasIds.length === 0) {
  //         return sendErrorReply(
  //           getErrorReply({
  //             type: 'badRequest',
  //             message: 'atlasIds array is required and must not be empty',
  //           }),
  //           reply,
  //         )
  //       }
  //
  //       const result = await entitySyncService.pullBatch(body.atlasIds)
  //
  //       return reply.send({
  //         data: result,
  //         message: `Batch pull completed: ${result.success} succeeded, ${result.failed} failed`,
  //       })
  //     } catch (error) {
  //       return handleRouteError(error, reply, fastify.log)
  //     }
  //   },
  // )
  //
  // // fastify.get(
  // //   '/logs',
  // //   {
  // //     schema: {
  // //       tags: ['sync-old'],
  // //       description:
  // //         'List synchronization logs with pagination and optional entity, operation, status, and date filters.',
  // //     },
  // //     preHandler: authenticate,
  // //   },
  // //   async (request, reply) => {
  // //     try {
  // //       const { page, limit, entityId, operation, status, startDate, endDate } = syncLogsQuerySchema.parse(
  // //         request.query,
  // //       )
  // //
  // //       const offset = (page - 1) * limit
  // //
  // //       let query = db.select().from(syncLogs)
  // //
  // //       const conditions = []
  // //       if (entityId) {
  // //         conditions.push(eq(syncLogs.entityId, entityId))
  // //       }
  // //       if (operation) {
  // //         conditions.push(eq(syncLogs.operation, operation))
  // //       }
  // //       if (status) {
  // //         conditions.push(eq(syncLogs.status, status))
  // //       }
  // //       if (startDate) {
  // //         conditions.push(gte(syncLogs.createdAt, new Date(startDate)))
  // //       }
  // //       if (endDate) {
  // //         conditions.push(lte(syncLogs.createdAt, new Date(endDate)))
  // //       }
  // //
  // //       if (conditions.length > 0) {
  // //         // biome-ignore lint/suspicious/noExplicitAny: Drizzle-orm magic
  // //         query = query.where(and(...conditions)) as any
  // //       }
  // //
  // //       const logs = await query.limit(limit).offset(offset).orderBy(desc(syncLogs.createdAt))
  // //
  // //       return reply.send({
  // //         data: logs,
  // //         meta: {
  // //           page,
  // //           limit,
  // //           count: logs.length,
  // //         },
  // //       })
  // //     } catch (error) {
  // //       return handleRouteError(error, reply, fastify.log)
  // //     }
  // //   },
  // // )
  //
  // fastify.delete(
  //   '/logs/cleanup',
  //   {
  //     schema: {
  //       tags: ['sync-old'],
  //       description: 'Delete synchronization logs older than the retention period, defaulting to 90 days.',
  //     },
  //     preHandler: authenticate,
  //   },
  //   async (request, reply) => {
  //     try {
  //       const { retentionDays = 90 } = request.query as { retentionDays?: number }
  //       const days = Math.max(1, Math.min(Number(retentionDays), 365))
  //
  //       const deleted = await entitySyncService.cleanupSyncLogs(days)
  //
  //       return reply.send({
  //         message: `Deleted ${deleted} sync log entries older than ${days} days`,
  //         deleted,
  //       })
  //     } catch (error) {
  //       return handleRouteError(error, reply, fastify.log)
  //     }
  //   },
  // )
}
