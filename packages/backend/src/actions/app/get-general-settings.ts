import type { ActionResult, ActionArgsWithDb } from '@/types.js'
import { getSetting } from '@/actions/app/common.js'
import { SETTINGS_KEYS } from '@/config/constants.js'

export const getGeneralSettings = async ({ db }: ActionArgsWithDb): Promise<ActionResult<unknown>> => {
  try {
    const [appName, autoSyncOnPublish, syncConflictResolution, country] = await Promise.all([
      getSetting(SETTINGS_KEYS.APP_NAME, db),
      getSetting(SETTINGS_KEYS.AUTO_SYNC_ON_PUBLISH, db),
      getSetting(SETTINGS_KEYS.SYNC_CONFLICT_RESOLUTION, db),
      getSetting(SETTINGS_KEYS.COUNTRY, db),
    ])

    return {
      success: true,
      data: {
        appName: appName || 'ATLAS Connector',
        autoSyncOnPublish: autoSyncOnPublish === 'true',
        syncConflictResolution: syncConflictResolution || 'manual',
        country,
      },
    }
  } catch (e) {
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
    }
  }
}
