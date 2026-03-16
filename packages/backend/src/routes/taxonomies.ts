import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'
import { taxonomySyncService } from '../services/atlas/taxonomy-sync.js'
import type { TaxonomyType } from '../services/atlas/types.js'

const taxonomyTypeSchema = z.enum([
  'activities_of_interest',
  'applications_and_technologies',
  'cluster_thematic_area',
  'cluster_type',
  'country',
  'cybersecurity_research_projects',
  'european_cybersecurity_competenc',
  'fields_of_activity',
  'funding_sources',
  'initiatives',
  'languages',
  'legal_status',
  'nationality',
  'position_category',
  'sectors',
  'technologies',
  'use_cases',
])

export async function taxonomyRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/count/:type?', { preHandler: authenticate }, async (request, reply) => {
    const { type } = request.params as { type: TaxonomyType }

    try {
      if (!type) {
        const result = await taxonomySyncService.countTaxonomies()
        return reply.send({ data: result })
      } else {
        const validatedType = taxonomyTypeSchema.parse(type)
        const [result] = await taxonomySyncService.countTaxonomiesByType(validatedType as TaxonomyType)

        return reply.send({
          data: { total: result.total },
        })
      }
    } catch (error) {
      logger.error('Failed to count taxonomies', error instanceof Error ? error : { message: String(error) })
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to count taxonomies',
      })
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
      logger.error('Failed to sync taxonomies', error instanceof Error ? error : { message: String(error) })
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to sync taxonomies',
      })
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
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid taxonomy type',
        })
      }
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to sync taxonomy',
      })
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
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid taxonomy type',
        })
      }
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch taxonomies',
      })
    }
  })

  fastify.get('/id/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

      const taxonomy = await taxonomySyncService.getTaxonomyById(id)

      if (!taxonomy) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Taxonomy not found',
        })
      }

      return reply.send({ data: taxonomy })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid taxonomy ID format',
        })
      }
      logger.error('Failed to fetch taxonomy', error instanceof Error ? error : { message: String(error) })
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch taxonomy',
      })
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
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid taxonomy type',
        })
      }
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to search taxonomies',
      })
    }
  })
}
