import type { ActionResult, ActionArgs } from '@/types.js'
import { users } from '@/db/schema.js'
import { z } from 'zod'
import { createUserSchema } from '@/actions/auth/common.js'
import { hashPassword } from '@/services/password.js'
import { eq } from 'drizzle-orm'
import type { PresentationUser } from '@/actions/auth/types.js'

export const createUser = async ({
  db,
  logger,
  data,
}: ActionArgs<unknown>): Promise<ActionResult<PresentationUser>> => {
  try {
    const body = createUserSchema.parse(data)

    // Check if email already exists
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1)

    if (existing) {
      return {
        success: false,
        code: 'conflict',
        message: 'User already exists.',
      }
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

    return {
      success: true,
      data: {
        ...newUser,
      },
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        success: false,
        code: 'validation',
        error: e,
      }
    }

    logger.error(e)
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
    }
  }
}
