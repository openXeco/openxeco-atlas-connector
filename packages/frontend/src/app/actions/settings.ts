'use server'

import type { ActionStateWithErrors, GeneralSettings } from '@/types'
import { getApiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { parseFormData } from '@/lib/utils'
import { generalSettingSchema } from '@/schema'

export async function updateGeneralSettings(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionStateWithErrors & GeneralSettings> {
  const values = parseFormData<GeneralSettings>(formData)
  const parsed = generalSettingSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
      country: values.country,
    }
  }

  // TODO temporary (update when there will be more settings)
  if (!parsed.data?.country) {
    return {
      success: true,
      message: 'Settings saved.',
    }
  }

  const apiClient = getApiClient()

  try {
    await apiClient.patch(
      '/settings/general',
      {
        country: parsed.data.country,
      },
      { credentials: 'include' },
    )

    return {
      success: true,
      message: 'Settings saved.',
      country: parsed.data.country,
    }
  } catch (e) {
    logger.error(e)
    return {
      success: false,
      error: (e as Error).message,
      country: values.country,
    }
  }
}
