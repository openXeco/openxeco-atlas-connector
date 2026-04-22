import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.js'
import { taxonomySyncService } from '../services/atlas/taxonomy-sync.js'
import type { TaxonomyType } from '../services/atlas/types.js'
import { sendErrorReply, handleRouteError } from '@/utils/reply-helpers.js'
import { taxonomyTypeSchema } from '@/services/atlas/taxonomy-types.js'

export async function taxonomyRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/count/:type?', { preHandler: authenticate }, async (request, reply) => {
    const { type } = request.params as { type: TaxonomyType }

    try {
      if (!type) {
        const result = await taxonomySyncService.countTaxonomies()
        return reply.send({ data: result })
      }
      const validatedType = taxonomyTypeSchema.parse(type)
      const [result] = await taxonomySyncService.countTaxonomiesByType(validatedType as TaxonomyType)

      return reply.send({
        data: { total: result.total },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.post('/sync', { preHandler: authenticate }, async (_request, reply) => {
    try {
      const result = await taxonomySyncService.syncAllTaxonomies()
      return reply.send({
        message: 'Taxonomy sync completed',
        result,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.post('/sync/:type', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { type } = request.params as { type: string }

      const validatedType = taxonomyTypeSchema.parse(type)

      const count = await taxonomySyncService.syncTaxonomyType(validatedType as TaxonomyType)

      return reply.send({
        message: `Synced ${count} terms for taxonomy type: ${type}`,
        count,
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.get('/:type', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { type } = request.params as { type: string }

      const validatedType = taxonomyTypeSchema.parse(type)

      const taxonomies = await taxonomySyncService.getTaxonomiesByType(validatedType as TaxonomyType)

      return reply.send({
        data: taxonomies,
        meta: {
          count: taxonomies.length,
          type: validatedType,
        },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.get('/id/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const taxonomy = await taxonomySyncService.getTaxonomyById(id)

      if (!taxonomy) {
        return sendErrorReply({ reply, type: 'Not found' })
      }

      return reply.send({ data: taxonomy })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  fastify.get('/search', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { q, type } = request.query as { q?: string; type?: string }

      const validatedType = type ? taxonomyTypeSchema.parse(type) : undefined

      const taxonomies = await taxonomySyncService.searchTaxonomies(q || '', validatedType as TaxonomyType | undefined)

      return reply.send({
        data: taxonomies,
        meta: {
          count: taxonomies.length,
          query: q,
          type: validatedType,
        },
      })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })
}
