import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { config } from './config/index.js'
import { errorHandler } from './middleware/error.js'
import { registerRoutes } from './routes/index.js'
import { getLoggerConfigByEnv } from './utils/logger.js'

export async function buildApp() {
  const fastify = Fastify({
    logger: getLoggerConfigByEnv(config.NODE_ENV, config.NODE_ENV === 'production' ? 'info' : 'debug'),
    routerOptions: {
      ignoreDuplicateSlashes: true,
    },
  })

  await fastify.register(helmet)

  await fastify.register(cors, {
    origin:
      config.NODE_ENV === 'development'
        ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://frontend:3000']
        : [config.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
  })

  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    allowList:
      config.NODE_ENV === 'production'
        ? [config.FRONTEND_URL || 'http://frontend:3000']
        : ['http://localhost:3000', 'http://frontend:3000', 'http://127.0.0.1:3000'],
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

  fastify.log.info('Fastify app built successfully')

  return fastify
}
