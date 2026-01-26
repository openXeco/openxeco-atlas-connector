import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { authRoutes } from './auth.js';
import { taxonomyRoutes } from './taxonomies.js';
import { entityRoutes } from './entities.js';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(taxonomyRoutes, { prefix: '/api/taxonomies' });
  await fastify.register(entityRoutes, { prefix: '/api/entities' });
}
