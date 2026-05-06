import 'server-only'

import type { User } from '@/types'
import { cache } from 'react'
import { getApiClient } from '@/lib/api-client'

export const getUserInfo = cache(async (): Promise<User | undefined> => {
  const apiClient = getApiClient()
  try {
    return await apiClient.getCurrentUser()
  } catch (_e) {
    return undefined
  }
})
