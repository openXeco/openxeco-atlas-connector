import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../config/database.js'

interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  services: {
    database: 'ok' | 'error'
  }
}

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_request, reply) => {
    let dbStatus: 'ok' | 'error' = 'error'

    try {
      await db.execute(sql`SELECT 1`)
      dbStatus = 'ok'
    } catch {
      dbStatus = 'error'
    }

    const response: HealthResponse = {
      status: dbStatus === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
    }

    const statusCode = response.status === 'ok' ? 200 : 503
    return reply.status(statusCode).send(response)
  })

  fastify.get('/health/live', async (_request, reply) => {
    return reply.send({ status: 'ok' })
  })

  fastify.get('/health/ready', async (_request, reply) => {
    try {
      await db.execute(sql`SELECT 1`)
      return reply.send({ status: 'ok' })
    } catch {
      return reply.status(503).send({ status: 'error', message: 'Database not ready' })
    }
  })
}
