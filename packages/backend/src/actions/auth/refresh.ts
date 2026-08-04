import type { ActionArgs, ActionResult } from '@/types.js'
import type fastifyJwt from '@fastify/jwt'
import { verifyRefreshToken, generateTokens } from '@/services/jwt.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const refresh = async ({
  data,
  db,
  logger,
  dependencies: { jwt },
}: ActionArgs<unknown, { jwt: fastifyJwt.JWT }>): Promise<ActionResult<unknown>> => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(data)

    if (!refreshToken) {
      return {
        success: false,
        code: 'unauthorized',
        message: 'Refresh token not found.',
      }
    }

    const payload = await verifyRefreshToken(jwt, refreshToken)

    if (!payload) {
      return {
        success: false,
        code: 'unauthorized',
        message: 'Invalid or expired refresh token.',
      }
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)

    if (!user) {
      return {
        success: false,
        code: 'unauthorized',
        message: 'Invalid or expired refresh token.',
      }
    }

    const tokens = generateTokens(jwt, {
      userId: user.id,
      email: user.email,
      role: user.role || 'admin',
    })

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
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
