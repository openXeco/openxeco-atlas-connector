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
  await fastify.register(authRoutes, { prefix: '/auth' })
  await fastify.register(taxonomyRoutes, { prefix: '/taxonomies' })
  await fastify.register(entityRoutes, { prefix: '/entities' })
  await fastify.register(syncRoutes, { prefix: '/sync' })
  await fastify.register(importRoutes, { prefix: '/import' })
  await fastify.register(userRoutes, { prefix: '/users' })
  await fastify.register(settingsRoutes, { prefix: '/settings' })
}
