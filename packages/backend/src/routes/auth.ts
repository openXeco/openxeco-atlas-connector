import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../config/database.js'
import { users } from '../db/schema.js'
import { verifyPassword } from '../services/password.js'
import { generateTokens, verifyRefreshToken } from '../services/jwt.js'
import { authenticate } from '../middleware/auth.js'

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
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        })
      }

      const isValidPassword = await verifyPassword(user.passwordHash, body.password)

      if (!isValidPassword) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        })
      }

      const tokens = generateTokens(fastify, {
        userId: user.id,
        email: user.email,
        role: user.role || 'admin',
      })

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      })

      return reply.send({
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors,
        })
      }
      throw error
    }
  })

  fastify.post('/refresh', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request, reply) => {
    try {
      const refreshToken = request.cookies.refreshToken || (request.body as { refreshToken?: string })?.refreshToken

      if (!refreshToken) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Refresh token not found',
        })
      }

      const payload = await verifyRefreshToken(fastify, refreshToken)

      if (!payload) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
        })
      }

      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)

      if (!user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'User not found',
        })
      }

      const tokens = generateTokens(fastify, {
        userId: user.id,
        email: user.email,
        role: user.role || 'admin',
      })

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      })

      return reply.send({
        accessToken: tokens.accessToken,
      })
    } catch (_error) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token refresh failed',
      })
    }
  })

  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    if (!request.currentUser) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User not authenticated',
      })
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
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
      })
    }

    return reply.send({ user })
  })

  fastify.post('/logout', { preHandler: authenticate }, async (_request, reply) => {
    reply.clearCookie('refreshToken', {
      path: '/api/auth/refresh',
    })

    return reply.send({ message: 'Logged out successfully' })
  })
}
