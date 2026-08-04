import type { ActionError as TActionError, GetErrorReplyArgs, ErrorReply } from '@/types.js'
import type { FastifyReply, FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { replies } from '@/config/constants.js'
import { ActionError } from '@/utils/action-helpers.js'

export const getErrorReply = ({ type = 'unexpected', message, additionalPayload }: GetErrorReplyArgs): ErrorReply => {
  const { status, error } = replies[type] || replies.unexpected

  return {
    status,
    payload: {
      error,
      ...(message ? { message } : undefined),
      ...(additionalPayload ? { ...additionalPayload } : undefined),
    },
  }
}

export const getReplyFromZodError = (error: z.ZodError, { additionalPayload }: GetErrorReplyArgs = {}) => {
  return getErrorReply({
    type: 'badRequest',
    message: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    additionalPayload,
  })
}

export const getReplyFromActionError = (actionError: TActionError, replyArgs?: GetErrorReplyArgs) => {
  if (actionError.code === 'validation' && actionError.error instanceof z.ZodError) {
    return getReplyFromZodError(actionError.error, replyArgs)
  }
  return getErrorReply({
    type: actionError.code,
    message: actionError.message,
    additionalPayload: replyArgs?.additionalPayload,
  })
}

export const sendErrorReply = ({ status, payload }: ErrorReply, reply: FastifyReply) => {
  return reply.status(status).send(payload)
}

export const handleRouteError = (error: unknown, reply: FastifyReply, logger: FastifyBaseLogger) => {
  let replyPayload: ErrorReply | undefined

  if (error instanceof z.ZodError) {
    replyPayload = getReplyFromZodError(error)
  }

  if (error instanceof ActionError) {
    replyPayload = getReplyFromActionError(error)
  }

  if (!replyPayload) {
    replyPayload = getErrorReply({ message: 'Unexpected error' })
    logger.error(error instanceof Error ? error : { message: String(error) }, 'Unexpected error')
  }

  return sendErrorReply(replyPayload, reply)
}
