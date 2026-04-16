'use server'

import { getApiClient } from '@/lib/api-client'
import type { GeneralSettings } from '@/types'
import { cache } from 'react'

export const getGeneralSettings = cache(async () => {
  const apiClient = getApiClient()

  const response = await apiClient.get<{ data: GeneralSettings }>('/settings/general', { credentials: 'include' })
  return response.data
})
