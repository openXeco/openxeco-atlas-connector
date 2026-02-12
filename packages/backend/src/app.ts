import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { config } from './config/index.js'
import { errorHandler } from './middleware/error.js'
import { registerRoutes } from './routes/index.js'
import { logger } from './utils/logger.js'

export async function buildApp() {
  const fastify = Fastify({
    logger: config.NODE_ENV === 'development',
  })

  await fastify.register(helmet)

  await fastify.register(cors, {
    origin: config.NODE_ENV === 'development' ? true : ['http://localhost:3000'],
    credentials: true,
  })

  await fastify.register(rateLimit, {
    global: false,
  })

  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
  })

  await fastify.register(cookie, {
    secret: config.JWT_SECRET,
    parseOptions: {},
  })

  fastify.setErrorHandler(errorHandler)

  await registerRoutes(fastify)

  logger.info('Fastify app built successfully')

  return fastify
}
