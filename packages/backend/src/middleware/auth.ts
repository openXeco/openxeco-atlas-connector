import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../services/jwt.js';
import type { JwtPayload } from '../services/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(request.server, token);

    if (!payload) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    request.currentUser = payload;
  } catch (_error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authenticate(request, reply);

  if (request.currentUser?.role !== 'admin') {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
}
