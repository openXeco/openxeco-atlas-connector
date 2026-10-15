import type { BaseActionArgs, ActionResult } from '@/types.js'
import type { OxeActionDependencies, OxeCredentials } from '@/actions/openxeco/types.js'
import { loginSchema } from '@/actions/auth/common.js'

export const oxeLogin = async ({
  dependencies: { oxeSessionManager },
  data: { email, password },
  id: userId,
}: BaseActionArgs<{ email: string; password: string }, OxeActionDependencies>): Promise<ActionResult> => {
  try {
    if (!userId || !email || !password) {
      return {
        success: false,
        code: 'validation',
        message: 'userId, email and password are required.',
      }
    }

    const credentials = loginSchema.safeParse({ email, password })
    await oxeSessionManager.login(userId, credentials.data as OxeCredentials)

    return { success: true, message: 'Login to openXeco successfully!' }
  } catch (e) {
    return {
      success: false,
      code: 'unauthorized',
      message: (e as Error).message,
    }
  }
}
