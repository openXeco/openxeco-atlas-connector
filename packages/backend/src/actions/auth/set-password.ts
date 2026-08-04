import type { ActionArgs, ActionResult } from '@/types.js'
import { changePasswordSchema } from '@/actions/auth/common.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/services/password.js'
import { z } from 'zod'

export const setPassword = async ({ data, id, logger, db }: ActionArgs<unknown>): Promise<ActionResult> => {
  try {
    if (!id) {
      return {
        success: false,
        code: 'validation',
        message: 'User ID is missing.',
      }
    }

    const body = changePasswordSchema.parse(data)

    // Check if user exists
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)

    if (!existing) {
      return {
        success: false,
        code: 'notFound',
        message: `User with id ${id} not found.`,
      }
    }

    const passwordHash = await hashPassword(body.password)

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))

    return {
      success: true,
      message: 'User updated.',
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
