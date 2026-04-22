import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { getLogger } from '../utils/logger.js'
import type { ApiError } from '@/types.js'

const logger = getLogger()

export function errorHandler(error: FastifyError, _request: FastifyRequest, reply: FastifyReply): void {
  logger.error(
    {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
    },
    'Request error',
  )

  const statusCode = error.statusCode ?? 500
  const response: ApiError = {
    statusCode,
    error: error.name || 'Internal Server Error',
    message: statusCode === 500 ? 'An unexpected error occurred' : error.message,
  }

  reply.status(statusCode).send(response)
}
