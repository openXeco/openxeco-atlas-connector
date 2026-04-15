'use server'

import { NextResponse } from 'next/server'
import type { SyncStatus } from '@/types'
import { getApiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const apiClient = getApiClient()
    const response = await apiClient.get<{ data: SyncStatus }>('/sync/status', { credentials: 'include' })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    logger.error(e)
    return NextResponse.json(`Unable to get the sync status. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
