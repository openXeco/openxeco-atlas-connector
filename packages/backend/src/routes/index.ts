import type { FastifyInstance } from 'fastify'
import { healthRoutes } from './health.js'
import { authRoutes } from './auth.js'
import { taxonomyRoutes } from './taxonomies.js'
import { entityRoutes } from './entities.js'
import { syncRoutes } from './sync.js'
import { importRoutes } from './import.js'
import { userRoutes } from './users.js'
import { settingsRoutes } from './settings.js'

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(healthRoutes)
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(taxonomyRoutes, { prefix: '/api/taxonomies' })
  await fastify.register(entityRoutes, { prefix: '/api/entities' })
  await fastify.register(syncRoutes, { prefix: '/api/sync' })
  await fastify.register(importRoutes, { prefix: '/api/import' })
  await fastify.register(userRoutes, { prefix: '/api/users' })
  await fastify.register(settingsRoutes, { prefix: '/api/settings' })
}
