import type { ActionArgs, DB } from '@/types.js'
import { handleActionResult } from '@/utils/action-helpers.js'
import { getGeneralSettings } from '@/actions/app/get-general-settings.js'
import { setGeneralSettings } from '@/actions/app/set-general-settings.js'

export const appActions = (db: DB, logger: ActionArgs['logger']) => {
  return {
    getGeneralSettings: async () => handleActionResult(await getGeneralSettings({ db, logger })),
    setGeneralSettings: async (data: unknown) => handleActionResult(await setGeneralSettings({ data, db, logger })),
  }
}
