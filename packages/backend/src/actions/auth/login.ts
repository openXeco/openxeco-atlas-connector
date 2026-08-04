import type { ActionArgs, ActionResult } from '@/types.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/services/password.js'
import { generateTokens } from '@/services/jwt.js'
import { z } from 'zod'
import type fastifyJwt from '@fastify/jwt'
import { loginSchema } from '@/actions/auth/common.js'

export const login = async ({
  data,
  db,
  logger,
  dependencies: { jwt },
}: ActionArgs<unknown, { jwt: fastifyJwt.JWT }>): Promise<ActionResult<unknown>> => {
  try {
    const body = loginSchema.parse(data)

    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1)

    if (!user) {
      return {
        success: false,
        code: 'unauthorized',
        message: 'Invalid email or password',
      }
    }

    const isValidPassword = await verifyPassword(user.passwordHash, body.password)

    if (!isValidPassword) {
      return {
        success: false,
        code: 'unauthorized',
        message: 'Invalid email or password',
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
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
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
