import type { FastifyInstance } from 'fastify'
import { db } from '@/config/database.js'
import { authenticate } from '../middleware/auth.js'

import { handleRouteError } from '@/utils/reply-helpers.js'
import { listQuerySchema } from '@/actions/entities/common.js'
import { entityActions } from '@/actions/entities/index.js'
import { getIdFromRequest } from '@/utils/request-helpers.js'

export async function entityRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = entityActions(db, fastify.log)

  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { page, limit, status, syncStatus } = listQuerySchema.parse(request.query)

      const response = await actions.list({ page, limit, status, syncStatus })

      return reply.send({ ...response.data })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.get('/status', { preHandler: authenticate }, async (_request, reply) => {
    try {
      const result = await actions.getStatusRecap()

      return reply.send(result)
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const id = getIdFromRequest(request.params)

      const result = await actions.get(id)

      return reply.send({ data: result.data })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const result = await actions.create(request.body)

      return reply.status(201).send({
        data: result.data,
        message: 'Entity created successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const id = getIdFromRequest(request.params)

      const result = await actions.update(id, request.body)

      return reply.send({
        data: result.data,
        message: 'Entity updated successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const id = getIdFromRequest(request.params)

      await actions.delete(id)

      return reply.send({
        message: 'Entity deleted successfully',
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  //TODO remove it
  // fastify.post('/:id/push', { preHandler: authenticate }, async (request, reply) => {
  //   try {
  //     const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
  //
  //     const result = await entitySyncService.pushEntity(id)
  //
  //     if (result.success) {
  //       return reply.send({
  //         data: result.atlasId,
  //         message: 'Entity synced to ATLAS successfully',
  //       })
  //     }
  //
  //     return sendErrorReply({
  //       reply,
  //       type: result.error === 'CONFLICT' ? 'conflict' : 'unexpected',
  //       message: result.error,
  //     })
  //   } catch (error) {
  //     return handleRouteError(error, reply, fastify.log)
  //   }
  // })
}
