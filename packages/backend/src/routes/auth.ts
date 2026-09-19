import type { FastifyInstance } from 'fastify'
import { db } from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { handleRouteError } from '@/utils/reply-helpers.js'
import { authActions } from '@/actions/auth/index.js'

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = authActions(db, fastify.log, fastify.jwt)

  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        description: 'Authenticate with an email and password and return access and refresh tokens.',
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      try {
        const result = await actions.login(request.body)

        return reply.send(result.data)
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        description: 'Issue new access and refresh tokens using a valid refresh token.',
      },
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      try {
        const result = await actions.refresh(request.body)

        return reply.send(result.data)
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.get(
    '/me',
    {
      schema: {
        tags: ['auth'],
        description: 'Get the profile of the authenticated user.',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      try {
        const result = await actions.currentUser({ currentUser: request.currentUser })

        return reply.send(result.data)
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.get(
    '/check',
    {
      schema: {
        tags: ['auth'],
        description: 'Check that the current request is authenticated.',
      },
      preHandler: authenticate,
    },
    async (_request, reply) => {
      return reply.send({ message: 'OK' })
    },
  )

  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        description: 'Acknowledge logout for the authenticated user without revoking tokens.',
      },
      preHandler: authenticate,
    },
    async (_request, reply) => {
      return reply.send({ message: 'Logged out successfully' })
    },
  )
}
