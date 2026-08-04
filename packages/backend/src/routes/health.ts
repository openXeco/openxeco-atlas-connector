import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../config/database.js'
import type { HealthResponse } from '@/types.js'

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
}
