import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../services/jwt.js'
import { sendErrorReply, getErrorReply } from '@/utils/reply-helpers.js'

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return sendErrorReply(
        getErrorReply({
          type: 'unauthorized',
          message: 'Missing or invalid authorization header',
        }),
        reply,
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyAccessToken(request.server.jwt, token)

    if (!payload) {
      return sendErrorReply(getErrorReply({ type: 'unauthorized', message: 'Invalid or expired token' }), reply)
    }

    request.currentUser = payload
  } catch (_error) {
    return sendErrorReply(getErrorReply({ type: 'unauthorized', message: 'Authentication failed' }), reply)
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authenticate(request, reply)

  // If authenticate already sent a response, stop here
  if (reply.sent) {
    return
  }

  if (request.currentUser?.role !== 'admin') {
    return sendErrorReply(getErrorReply({ type: 'forbidden', message: 'Admin access required' }), reply)
  }
}
