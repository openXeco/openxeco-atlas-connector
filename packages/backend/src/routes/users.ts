import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, count } from 'drizzle-orm'
import { db } from '../config/database.js'
import { users } from '../db/schema.js'
import { hashPassword } from '../services/password.js'
import { requireAdmin } from '../middleware/auth.js'
import { sendErrorReply, handleRouteError } from '@/utils/reply-helpers.js'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const changePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // List all users
  fastify.get('/', { preHandler: requireAdmin }, async (_request, reply) => {
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt)

    return reply.send({ data: userList })
  })

  // Create user
  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const body = createUserSchema.parse(request.body)

      // Check if email already exists
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1)

      if (existing) {
        return sendErrorReply({ reply, type: 'conflict', message: 'A user with this email already exists' })
      }

      const passwordHash = await hashPassword(body.password)

      const [newUser] = await db
        .insert(users)
        .values({
          email: body.email,
          passwordHash,
          role: 'admin',
        })
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })

      return reply.status(201).send({ data: newUser })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  // Update user email
  fastify.patch('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateUserSchema.parse(request.body)

      // Check if user exists
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)

      if (!existing) {
        return sendErrorReply({ reply, type: 'notFound' })
      }

      // Check if new email is already taken by another user
      const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1)

      if (emailTaken && emailTaken.id !== id) {
        return sendErrorReply({ reply, type: 'conflict', message: 'Email already in use' })
      }

      const [updated] = await db
        .update(users)
        .set({
          email: body.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })

      return reply.send({ data: updated })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  // Change user password
  fastify.patch('/:id/password', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = changePasswordSchema.parse(request.body)

      // Check if user exists
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)

      if (!existing) {
        return sendErrorReply({ reply, type: 'notFound' })
      }

      const passwordHash = await hashPassword(body.password)

      await db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))

      return reply.send({ message: 'Password updated successfully' })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })

  // Delete user
  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }

    // Check if user exists
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)

    if (!existing) {
      return sendErrorReply({ reply, type: 'notFound' })
    }

    // Prevent deleting yourself
    if (request.currentUser?.userId === id) {
      return sendErrorReply({ reply, type: 'badRequest', message: 'You cannot delete your own account' })
    }

    // Prevent deleting if only one user exists
    const [{ total }] = await db.select({ total: count() }).from(users)

    if (total <= 1) {
      return sendErrorReply({ reply, type: 'badRequest', message: 'Cannot delete the last user' })
    }

    try {
      await db.delete(users).where(eq(users.id, id))
      return reply.send({ message: 'User deleted successfully' })
    } catch (error) {
      return handleRouteError(error, reply, fastify)
    }
  })
}
