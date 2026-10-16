import type { FastifyInstance } from 'fastify'
import { oxeActions } from '@/actions/openxeco/index.js'
import { db } from '@/config/database.js'
import { authenticate } from '@/middleware/auth.js'
import { sendErrorReply, handleRouteError } from '@/utils/reply-helpers.js'

export async function oxeRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = oxeActions(db, fastify.log)

  fastify.get(
    '',
    {
      schema: {
        tags: ['openXeco'],
        description: 'openXeco login status',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      // This normally should not happen.
      if (!request.currentUser) {
        return sendErrorReply({ status: 500, payload: { error: 'User not found in request.' } }, reply)
      }

      try {
        await actions.check(request.currentUser.userId)
        return reply.send({ success: true })
      } catch (_e) {
        return reply.send({ success: false })
      }
    },
  )

  fastify.post(
    '/login',
    {
      schema: {
        tags: ['openXeco'],
        description: 'Login to openXeco',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      // This normally should not happen.
      if (!request.currentUser) {
        return sendErrorReply({ status: 500, payload: { error: 'User not found in request.' } }, reply)
      }

      try {
        await actions.login(request.currentUser?.userId, request.body as { email: string; password: string })

        return reply.status(201).send({ success: true })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )

  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['openXeco'],
        description: 'Logout from openXeco',
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      // This normally should not happen.
      if (!request.currentUser) {
        return sendErrorReply({ status: 500, payload: { error: 'User not found in request.' } }, reply)
      }

      try {
        await actions.logout(request.currentUser?.userId)

        return reply.status(201).send({ success: true })
      } catch (error) {
        return handleRouteError(error, reply, fastify.log)
      }
    },
  )
}
