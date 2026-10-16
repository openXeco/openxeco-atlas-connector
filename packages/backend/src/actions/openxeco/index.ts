import type { DB, ActionArgsWithDb } from '@/types.js'
import { getOxeSessionManager } from '@/actions/openxeco/utils/openxeco-session.js'
import { config } from '@/config/index.js'
import { handleActionResult } from '@/utils/action-helpers.js'
import { oxeLogin } from '@/actions/openxeco/login.js'
import { oxeLogout } from '@/actions/openxeco/logout.js'
import { oxeCheck } from '@/actions/openxeco/check.js'

export const oxeActions = (_db: DB, logger: ActionArgsWithDb['logger']) => {
  const oxeSessionManager = getOxeSessionManager({ appConfig: config, logger })

  return {
    login: async (userId: string, { email, password }: { email: string; password: string }) =>
      handleActionResult(
        await oxeLogin({ dependencies: { oxeSessionManager }, logger, id: userId, data: { email, password } }),
      ),

    logout: async (userId: string) =>
      handleActionResult(await oxeLogout({ dependencies: { oxeSessionManager }, id: userId, logger })),

    check: async (userId: string) =>
      handleActionResult(await oxeCheck({ dependencies: { oxeSessionManager }, id: userId, logger })),
  }
}
