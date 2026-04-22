import 'server-only'

import { cache } from 'react'
import type { SyncRecap } from '@/types'
import { getApiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'

export const getSyncStatus = cache(async () => {
  const apiClient = getApiClient()
  try {
    const response = await apiClient.get<{ data: SyncRecap }>('/sync/status', { credentials: 'include' })
    return response.data
  } catch (e) {
    logger.error(e)
    return undefined
  }
})
