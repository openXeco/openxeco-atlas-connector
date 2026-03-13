'use server'

import { apiClientBackend } from '@/lib/api-backend'
import type { ActionState } from '@/types'

export async function syncAll(): Promise<ActionState> {
  try {
    await apiClientBackend.post('/api/taxonomies/sync', {}, { credentials: 'include' })
    return {
      success: true,
      message: 'Successfully synced all taxonomies.',
    }
  } catch (_e) {
    return {
      success: false,
      error: 'Error syncing taxonomies.',
    }
  }
}

export async function syncByType(prevState: unknown, formData: FormData): Promise<ActionState> {
  const type = formData.get('type')

  try {
    await apiClientBackend.post(`/api/taxonomies/sync/${type}`, {}, {credentials: 'include'})
    return {
      success: true,
      message: 'Successfully synced.',
    }
  } catch (_e) {
    return {
      success: false,
      error: 'Error syncing taxonomy.',
    }
  }
}
