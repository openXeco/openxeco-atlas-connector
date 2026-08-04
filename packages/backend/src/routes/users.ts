import type { FastifyInstance } from 'fastify'
import { db } from '../config/database.js'
import { requireAdmin } from '../middleware/auth.js'
import { handleRouteError } from '@/utils/reply-helpers.js'
import { idParamSchema } from '@/actions/auth/common.js'
import { authActions } from '@/actions/auth/index.js'

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = authActions(db, fastify.log, fastify.jwt)
  // List all users
  fastify.get('/', { preHandler: requireAdmin }, async (_request, reply) => {
    try {
      const result = await actions.list()

      return reply.send({ data: result.data })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  // Create user
  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const result = await actions.create(request.body)

      return reply.status(201).send({ data: result.data })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  // Update user email
  fastify.patch('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)

      const result = await actions.update({ id, data: request.body })

      return reply.send({ data: result.data })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  // Change user password
  fastify.patch('/:id/password', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)

      await actions.setPassword({ id, data: request.body })

      return reply.send({ message: 'Password updated successfully' })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  // Delete user
  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)

      await actions.delete(id, { currentUser: request.currentUser })

      return reply.send({ message: 'User deleted successfully' })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })
}
