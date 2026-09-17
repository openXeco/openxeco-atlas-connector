import type { FastifyInstance } from 'fastify'
import { db } from '../config/database.js'
import { requireAdmin } from '../middleware/auth.js'
import { handleRouteError } from '@/utils/reply-helpers.js'
import { authActions } from '@/actions/auth/index.js'
import { idParamSchema } from '@/utils/request-helpers.js'

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = authActions(db, fastify.log, fastify.jwt)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['users'],
        description: 'List all users.',
      },
      preHandler: requireAdmin,
    },
    async (_request, reply) => {
      try {
        const result = await actions.list()

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
        tags: ['users'],
        description: 'Create a user.',
      },
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      try {
        const result = await actions.create(request.body)

        return reply.status(201).send({ data: result.data })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['users'],
        description: "Update user's email.",
      },
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params)

        const result = await actions.update({ id, data: request.body })

        return reply.send({ data: result.data })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.patch(
    '/:id/password',
    {
      schema: {
        tags: ['users'],
        description: "Change user's password.",
      },
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params)

        await actions.setPassword({ id, data: request.body })

        return reply.send({ message: 'Password updated successfully' })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['users'],
        description: 'Delete user.',
      },
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params)

        await actions.delete(id, { currentUser: request.currentUser })

        return reply.send({ message: 'User deleted successfully' })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )
}
