'use server'

import { cache } from 'react'
import { apiClientBackend } from '@/lib/api-backend'
import { SyncRecap } from '@/types'

export const getSyncStatus = cache(async () => {
  try {
    const response = await apiClientBackend.get<{data: SyncRecap}>('/api/sync/status', {credentials: 'include'})
    return response.data
  } catch (e) {
    console.error(e)
    return undefined
  }

})
