import type { FastifyInstance } from 'fastify'
import { db } from '@/config/database.js'
import { authenticate } from '../middleware/auth.js'

import { handleRouteError } from '@/utils/reply-helpers.js'
import { entityActions } from '@/actions/entities/index.js'
import { getIdFromRequest } from '@/utils/request-helpers.js'
import { listQuerySchema } from '@/actions/entities/constants.js'

export async function entityRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = entityActions(db, fastify.log)

  fastify.get(
    '/',
    {
      schema: {
        tags: ['entities'],
        description: 'List entities with pagination and optional moderation and synchronization status filters.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const { page, limit, status, syncStatus } = listQuerySchema.parse(request.query)

        const response = await actions.list({ page, limit, status, syncStatus })

        return reply.send({ ...response.data })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.get(
    '/status',
    {
      schema: {
        tags: ['entities'],
        description: 'Get entity counts grouped by moderation and synchronization status.',
      },
      preHandler: authenticate,
    },
    async (_request, reply) => {
      try {
        const result = await actions.getStatusRecap()

        return reply.send(result)
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['entities'],
        description: 'Get a local entity by its ID.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const id = getIdFromRequest(request.params)

        const result = await actions.get(id)

        return reply.send({ data: result.data })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.post(
    '/',
    {
      schema: {
        tags: ['entities'],
        description: 'Create a local entity.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const result = await actions.create(request.body)

        return reply.status(201).send({
          data: result.data,
          message: 'Entity created successfully',
        })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['entities'],
        description: 'Update a local entity by its ID.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
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
    },
  )

  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['entities'],
        description: 'Delete a local entity by its ID.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const id = getIdFromRequest(request.params)

        await actions.delete(id)

        return reply.send({
          message: 'Entity deleted successfully',
        })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )
}
