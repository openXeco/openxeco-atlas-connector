import type { ActionArgs, JwtPayload, ActionResult } from '@/types.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import type { PresentationUser } from '@/actions/auth/types.js'

export const getCurrentUser = async ({
  data,
  db,
}: ActionArgs<{ currentUser?: JwtPayload }>): Promise<ActionResult<PresentationUser>> => {
  try {
    if (!data.currentUser) {
      return {
        success: false,
        code: 'unauthorized',
        message: 'User not authenticated.',
      }
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, data.currentUser.userId))
      .limit(1)

    if (!user) {
      return {
        success: false,
        code: 'unauthorized',
        message: 'User not found.',
      }
    }

    return {
      success: true,
      data: user,
    }
  } catch (e) {
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
    }
  }
}
