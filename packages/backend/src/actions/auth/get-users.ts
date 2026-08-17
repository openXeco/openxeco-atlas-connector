import type { ActionArgsWithDb, ActionResult } from '@/types.js'
import { users } from '@/db/schema.js'
import type { PresentationUser } from '@/actions/auth/types.js'

export const getUsers = async ({ db }: ActionArgsWithDb): Promise<ActionResult<PresentationUser[]>> => {
  try {
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt)

    return {
      success: true,
      data: usersList,
    }
  } catch (e) {
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
    }
  }
}
