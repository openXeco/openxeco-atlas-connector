import type { DB, ActionArgsWithDb } from '@/types.js'
import { getOxeSessionManager } from '@/actions/openxeco/utils/openxeco-session.js'
import { config } from '@/config/index.js'
import { handleActionResult } from '@/utils/action-helpers.js'
import { oxeLogin } from '@/actions/openxeco/login.js'
import { oxeLogout } from '@/actions/openxeco/logout.js'

export const openxecoActions = (_db: DB, logger: ActionArgsWithDb['logger']) => {
  const oxeSessionManager = getOxeSessionManager({ appConfig: config, logger })

  return {
    login: async (userId: string, email: string, password: string) =>
      handleActionResult(
        await oxeLogin({ dependencies: { oxeSessionManager }, logger, id: userId, data: { email, password } }),
      ),

    logout: async (userId: string) =>
      handleActionResult(await oxeLogout({ dependencies: { oxeSessionManager }, id: userId, logger })),
  }
}
