import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../services/jwt.js'
import { sendErrorReply } from '@/utils/reply-helpers.js'

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return sendErrorReply({
        reply,
        type: 'unauthorized',
        message: 'Missing or invalid authorization header',
      })
    }

    const token = authHeader.substring(7)
    const payload = await verifyAccessToken(request.server, token)

    if (!payload) {
      return sendErrorReply({ reply, type: 'unauthorized', message: 'Invalid or expired token' })
    }

    request.currentUser = payload
  } catch (_error) {
    return sendErrorReply({ reply, type: 'unauthorized', message: 'Authentication failed' })
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authenticate(request, reply)

  // If authenticate already sent a response, stop here
  if (reply.sent) {
    return
  }

  if (request.currentUser?.role !== 'admin') {
    return sendErrorReply({ reply, type: 'forbidden', message: 'Admin access required' })
  }
}
