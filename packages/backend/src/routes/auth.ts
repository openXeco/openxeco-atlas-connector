import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../config/database.js'
import { users } from '../db/schema.js'
import { verifyPassword } from '../services/password.js'
import { generateTokens, verifyRefreshToken } from '../services/jwt.js'
import { authenticate } from '../middleware/auth.js'
import { sendErrorReply, handleZodError } from '@/utils/reply-helpers.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)

      const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1)

      if (!user) {
        return sendErrorReply({ reply, type: 'unauthorized', message: 'Invalid email or password' })
      }

      const isValidPassword = await verifyPassword(user.passwordHash, body.password)

      if (!isValidPassword) {
        return sendErrorReply({ reply, type: 'unauthorized', message: 'Invalid email or password' })
      }

      const tokens = generateTokens(fastify, {
        userId: user.id,
        email: user.email,
        role: user.role || 'admin',
      })

      return reply.send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, { reply })
      }
      throw error
    }
  })

  fastify.post('/refresh', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request, reply) => {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string() }).parse(request.body)

      if (!refreshToken) {
        return sendErrorReply({ reply, type: 'unauthorized', message: 'Refresh token not found' })
      }

      const payload = await verifyRefreshToken(fastify, refreshToken)

      if (!payload) {
        return sendErrorReply({ reply, type: 'unauthorized', message: 'Invalid or expired refresh token' })
      }

      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)

      if (!user) {
        return sendErrorReply({ reply, type: 'unauthorized', message: 'User not found' })
      }

      const tokens = generateTokens(fastify, {
        userId: user.id,
        email: user.email,
        role: user.role || 'admin',
      })

      return reply.send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      })
    } catch (error) {
      fastify.log.error(error instanceof Error ? error : { message: String(error) }, 'Token refresh failed')
      return sendErrorReply({ reply, type: 'unauthorized', message: 'Token refresh failed' })
    }
  })

  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    if (!request.currentUser) {
      return sendErrorReply({ reply, type: 'unauthorized', message: 'User not authenticated' })
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, request.currentUser.userId))
      .limit(1)

    if (!user) {
      return sendErrorReply({ reply, type: 'unauthorized', message: 'User not found' })
    }

    return reply.send({ user })
  })

  fastify.get('/check', { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ message: 'OK' })
  })

  fastify.post('/logout', { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ message: 'Logged out successfully' })
  })
}
