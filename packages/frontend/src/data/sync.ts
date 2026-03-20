import 'server-only'

import { cache } from 'react'
import type { SyncRecap } from '@/types'
import { getApiClient } from '@/lib/api-client'

export const getSyncStatus = cache(async () => {
  const apiClient = await getApiClient()
  try {
    const response = await apiClient.get<{ data: SyncRecap }>('/sync/status', { credentials: 'include' })
    return response.data
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Fine here
    console.error(e)
    return undefined
  }
})
