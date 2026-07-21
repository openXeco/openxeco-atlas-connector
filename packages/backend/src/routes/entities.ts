import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/config/database.js'
import { entities } from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'

import { entitySyncService } from '@/services/sync/entity-sync.js'
import { sendErrorReply, handleRouteError } from '@/utils/reply-helpers.js'
import { createEntity } from '@/actions/entities/create.js'
import { updateEntity } from '@/actions/entities/update.js'
import { listQuerySchema } from '@/actions/entities/common.js'
import { getEntities } from '@/actions/entities/list.js'
import { getEntity } from '@/actions/entities/get.js'

export async function entityRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { page, limit, status, syncStatus } = listQuerySchema.parse(request.query)

      const response = await getEntities({ page, limit, status, syncStatus })

      return reply.send(response)
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const entity = await getEntity(id)

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
}
