import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, count } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { hashPassword } from '../services/password.js';
import { authenticate } from '../middleware/auth.js';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const changePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // List all users
  fastify.get('/', { preHandler: authenticate }, async (_request, reply) => {
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    return reply.send({ data: userList });
  });

  // Create user
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = createUserSchema.parse(request.body);

      // Check if email already exists
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (existing) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A user with this email already exists',
        });
      }

      const passwordHash = await hashPassword(body.password);

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
        });

      return reply.status(201).send({ data: newUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input',
          details: error.errors,
        });
      }
      throw error;
    }
  });

  // Update user email
  fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateUserSchema.parse(request.body);

      // Check if user exists
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Check if new email is already taken by another user
      const [emailTaken] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (emailTaken && emailTaken.id !== id) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'This email is already in use',
        });
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
        });

      return reply.send({ data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input',
          details: error.errors,
        });
      }
      throw error;
    }
  });

  // Change user password
  fastify.patch('/:id/password', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = changePasswordSchema.parse(request.body);

      // Check if user exists
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      const passwordHash = await hashPassword(body.password);

      await db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      return reply.send({ message: 'Password updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input',
          details: error.errors,
        });
      }
      throw error;
    }
  });

  // Delete user
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Check if user exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existing) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (request.currentUser?.userId === id) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'You cannot delete your own account',
      });
    }

    // Prevent deleting if only one user exists
    const [{ total }] = await db.select({ total: count() }).from(users);

    if (total <= 1) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Cannot delete the last user',
      });
    }

    await db.delete(users).where(eq(users.id, id));

    return reply.send({ message: 'User deleted successfully' });
  });
}
