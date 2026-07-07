import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, desc, and, count as countFn } from 'drizzle-orm'
import { db } from '@/config/database.js'
import { entities, entityVersions } from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'

import { entitySyncService } from '@/services/sync/entity-sync.js'
import { sendErrorReply, handleRouteError } from '@/utils/reply-helpers.js'
import { createEntity, updateEntity } from '@/actions/entities.js'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['draft', 'ready_for_publication', 'published', 'to_be_rejected', 'rejected']).optional(),
  syncStatus: z.enum(['local', 'pending_push', 'synced', 'conflict', 'failed']).optional(),
})

export async function entityRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { page, limit, status, syncStatus } = listQuerySchema.parse(request.query)

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

      return reply.send({
        data: results,
        meta: {
          page,
          limit,
          count: results.length,
          total,
        },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const entity = await db.query.entities.findFirst({
        where: { id },
        with: {
          country: true,
          clusterType: true,
          thematicAreas: true,
          sectors: true,
          technologies: true,
          useCases: true,
          fieldsOfActivity: true,
        },
      })

      if (!entity) {
        return sendErrorReply({ reply, type: 'notFound' })
      }

      return reply.send({ data: entity })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const entity = await createEntity({ data: request.body, db })
      return reply.status(201).send({
        data: entity,
        message: 'Entity created successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const entity = await updateEntity({ id, data: request.body, db })

      return reply.send({
        data: entity,
        message: 'Entity updated successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const [existing] = await db.select().from(entities).where(eq(entities.id, id)).limit(1)

      if (!existing) {
        return sendErrorReply({ reply, type: 'notFound' })
      }

      await db.delete(entities).where(eq(entities.id, id))

      return reply.send({
        message: 'Entity deleted successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.post('/:id/push', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const result = await entitySyncService.pushEntity(id)

      if (result.success) {
        return reply.send({
          data: result.atlasId,
          message: 'Entity synced to ATLAS successfully',
        })
      }

      return sendErrorReply({
        reply,
        type: result.error === 'CONFLICT' ? 'conflict' : 'unexpected',
        message: result.error,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.get('/:id/versions', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const versions = await db
        .select()
        .from(entityVersions)
        .where(eq(entityVersions.entityId, id))
        .orderBy(desc(entityVersions.createdAt))

      return reply.send({
        data: versions,
        meta: {
          count: versions.length,
        },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })
}
