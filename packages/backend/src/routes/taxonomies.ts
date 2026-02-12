import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { count } from 'drizzle-orm'
import { db } from '../config/database.js'
import { taxonomies } from '../db/schema.js'
import { authenticate } from '../middleware/auth.js'
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
  'institution',
  'languages',
  'legal_status',
  'nationality',
  'organization_type',
  'position_category',
  'sectors',
  'technologies',
  'use_cases',
  'citations_source',
])

export async function taxonomyRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/count', { preHandler: authenticate }, async (_request, reply) => {
    try {
      const [result] = await db.select({ total: count() }).from(taxonomies)
      return reply.send({ data: { total: result.total } })
    } catch (_error) {
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
    } catch (_error) {
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
      const { id } = request.params as { id: string }

      const taxonomy = await taxonomySyncService.getTaxonomyById(id)

      if (!taxonomy) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Taxonomy not found',
        })
      }

      return reply.send({ data: taxonomy })
    } catch (_error) {
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
