import type { ActionArgs, ActionResult } from '@/types.js'
import { generalSettingsSchema, setSetting } from '@/actions/app/common.js'
import { SETTINGS_KEYS } from '@/config/constants.js'
import { type ZodIssue, z } from 'zod'

export const setGeneralSettings = async ({ data, db, logger }: ActionArgs<unknown>): Promise<ActionResult> => {
  try {
    const body = generalSettingsSchema.parse(data)

    const updates: Promise<void>[] = []

    if (body.appName !== undefined) {
      updates.push(setSetting(SETTINGS_KEYS.APP_NAME, body.appName, db))
    }

    if (body.autoSyncOnPublish !== undefined) {
      updates.push(setSetting(SETTINGS_KEYS.AUTO_SYNC_ON_PUBLISH, String(body.autoSyncOnPublish), db))
    }

    if (body.syncConflictResolution !== undefined) {
      updates.push(setSetting(SETTINGS_KEYS.SYNC_CONFLICT_RESOLUTION, body.syncConflictResolution, db))
    }

    if (body.country !== undefined) {
      const country = await db.query.taxonomies.findFirst({
        where: {
          id: body.country,
          taxonomyType: 'country',
        },
      })

      if (!country) {
        return {
          success: false,
          code: 'validation',
          message: 'Invalid country',
          additionalPayload: {
            details: [
              {
                code: 'invalid_type',
                message: 'Country not found in database',
                path: ['body', 'country'],
              },
            ] as ZodIssue[],
          },
        }
      }

      updates.push(setSetting(SETTINGS_KEYS.COUNTRY, body.country, db))
    }

    await Promise.all(updates)

    return {
      success: true,
      message: 'General settings updated successfully.',
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
