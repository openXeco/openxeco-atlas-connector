import type { ActionArgs, ActionResult, JwtPayload } from '@/types.js'
import { users } from '@/db/schema.js'
import { eq, count } from 'drizzle-orm'

export const deleteUser = async ({
  id,
  db,
  data: { currentUser },
}: ActionArgs<{ currentUser?: JwtPayload }>): Promise<ActionResult> => {
  try {
    if (!id) {
      return {
        success: false,
        code: 'validation',
        message: 'User ID is missing.',
      }
    }

    if (!currentUser) {
      return {
        success: false,
        code: 'unexpected',
        message: 'Current user not present.',
      }
    }

    if (currentUser.userId === id) {
      return {
        success: false,
        code: 'forbidden',
        message: 'You cannot delete your own account.',
      }
    }

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)

    if (!existing) {
      return {
        success: false,
        code: 'notFound',
        message: `User with id ${id} not found.`,
      }
    }

    // Prevent deleting if only one user exists
    const [{ total }] = await db.select({ total: count() }).from(users)

    if (total <= 1) {
      return {
        success: false,
        code: 'forbidden',
        message: 'You cannot delete the last user.',
      }
    }

    await db.delete(users).where(eq(users.id, id))

    return {
      success: true,
    }
  } catch (e) {
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
    }
  }
}
