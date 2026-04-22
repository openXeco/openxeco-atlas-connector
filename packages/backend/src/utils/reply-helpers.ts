import type { BasicErrorResponse } from '@/types.js'
import type { FastifyReply } from 'fastify'
import type { z } from 'zod'

const replies: Record<string, BasicErrorResponse> = {
  unauthorized: {
    status: 401,
    error: 'Unauthorized',
  },
  forbidden: {
    status: 403,
    error: 'Forbidden',
  },
  badRequest: {
    status: 400,
    error: 'Validation failed',
  },
  conflict: {
    status: 409,
    error: 'Conflict',
  },
  notFound: {
    status: 404,
    error: 'Not found',
  },
  unexpected: {
    status: 500,
    error: 'Internal server error',
  },
  external: {
    status: 502,
    error: 'External API error',
  },
} as const

type SendErrorReplyArgs = {
  type?: keyof typeof replies
  reply: FastifyReply
  message?: string
  additionalPayload?: Record<string, unknown>
}

export const handleZodError = (error: z.ZodError, { reply, additionalPayload }: SendErrorReplyArgs) => {
  return sendErrorReply({
    type: 'badRequest',
    reply,
    message: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    additionalPayload,
  })
}

export const sendErrorReply = ({ type = 'unexpected', reply, message, additionalPayload }: SendErrorReplyArgs) => {
  const { status, error } = replies[type] || replies.unexpected

  return reply.status(status).send({
    error,
    ...(message ? { message } : undefined),
    ...(additionalPayload ? { ...additionalPayload } : undefined),
  })
}
