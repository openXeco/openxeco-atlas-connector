import type { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.js'
import { taxonomyActions } from '@/actions/taxonomies/index.js'
import { db } from '@/config/database.js'
import { handleRouteError } from '@/utils/reply-helpers.js'
import { getIdFromRequest } from '@/utils/request-helpers.js'
import type { TaxonomyType } from '@/types.js'

export async function taxonomyRoutes(fastify: FastifyInstance): Promise<void> {
  const actions = taxonomyActions(db, fastify.log)

  fastify.get('/count/:type?', { preHandler: authenticate }, async (request, reply) => {
    const { type } = request.params as { type: TaxonomyType }

    try {
      const result = await actions.count(type)

      return reply.send({
        data: result.data,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.get('/:type', { preHandler: authenticate }, async (request, reply) => {
    const { type } = request.params as { type: TaxonomyType }
    try {
      const result = await actions.getByType(type)

      return reply.send({
        data: result.data?.taxonomies,
        meta: result.data?.meta,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })

  fastify.get('/id/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const id = getIdFromRequest(request.params)

      const result = await actions.get(id)

      return reply.send({ data: result.data })
    } catch (error) {
      return handleRouteError(error, reply, fastify.log)
    }
  })
}
