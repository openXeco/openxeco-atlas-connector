import 'server-only'

import { cache } from 'react'
import { SyncRecap } from '@/types'
import { getApiClient } from '@/lib/api-client'

export const getSyncStatus = cache(async () => {
  const apiClient = await getApiClient()
  try {
    const response = await apiClient.get<{ data: SyncRecap }>('/sync/status', { credentials: 'include' })
    return response.data
  } catch (e) {
    console.error(e)
    return undefined
  }
})
