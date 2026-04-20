'use server'

import { NextResponse } from 'next/server'
import type { SyncStatus } from '@/types'
import { getApiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const apiClient = getApiClient()
    const generalResponse = await apiClient.get<{ data: SyncStatus }>('/settings/general', { credentials: 'include' })

    return NextResponse.json({ data: { general: generalResponse.data } })
  } catch (e) {
    logger.error(e)
    return NextResponse.json(`Unable to get the settings. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
