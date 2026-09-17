import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import { config } from './config/index.js'
import { errorHandler } from './middleware/error.js'
import { registerRoutes } from './routes/index.js'
import { getLoggerConfigByEnv } from './utils/logger.js'
import Swagger from '@fastify/swagger'
import SwaggerUI from '@fastify/swagger-ui'
import packageJson from '../package.json' with { type: 'json' }
import { authenticate, requireAdmin } from '@/middleware/auth.js'

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

  fastify.setErrorHandler(errorHandler)

  fastify.register(Swagger, {
    mode: 'dynamic',
    openapi: {
      openapi: '3.1.0',
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Local server',
        },
      ],
      info: {
        title: 'openXeco ATLAS connector API',
        version: packageJson.version,
      },
      components: {
        securitySchemes: {
          userRequired: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'User authorization bearer token',
          },
        },
      },
    },
    transform: ({ schema, url, route }) => {
      const handlers = Array.isArray(route.preHandler) ? route.preHandler : [route.preHandler]

      const requiresAuth = handlers.some((handler) => handler === authenticate || handler === requireAdmin)

      return {
        schema: {
          ...schema,
          security: requiresAuth ? [{ userRequired: [] }] : [],
        },
        url,
      }
    },
  })

  fastify.register(SwaggerUI, {
    routePrefix: '/openapi',
    uiConfig: {
      layout: 'BaseLayout',
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    logo: undefined,
  })

  await registerRoutes(fastify)

  fastify.log.info('Fastify app built successfully')
  fastify.log.info('Swagger is available at /openapi')

  return fastify
}
