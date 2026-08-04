import type { ActionArgs, ActionResult } from '@/types.js'
import type { PresentationUser } from '@/actions/auth/types.js'
import { updateUserSchema } from '@/actions/auth/common.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const updateUser = async ({
  data,
  id,
  logger,
  db,
}: ActionArgs<unknown>): Promise<ActionResult<PresentationUser>> => {
  try {
    if (!id) {
      return {
        success: false,
        code: 'validation',
        message: 'User ID is missing.',
      }
    }
    const body = updateUserSchema.parse(data)

    // Check if user exists
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)

    if (!existing) {
      return {
        success: false,
        code: 'notFound',
        message: `User with id ${id} not found.`,
      }
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

    return {
      success: true,
      data: updated,
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
