import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error.js';
import { registerRoutes } from './routes/index.js';
import { logger } from './utils/logger.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: config.NODE_ENV === 'development',
  });

  await fastify.register(cors, {
    origin: config.NODE_ENV === 'development' ? true : ['http://localhost:3000'],
    credentials: true,
  });

  fastify.setErrorHandler(errorHandler);

  await registerRoutes(fastify);

  logger.info('Fastify app built successfully');

  return fastify;
}
