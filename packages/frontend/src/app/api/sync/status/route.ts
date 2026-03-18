'use server'

import { NextResponse } from 'next/server'
import { SyncStatus } from '@/types'
import { getApiClient } from '@/lib/api-client'

export async function GET() {
  try {
    const apiClient = getApiClient()
    const response = await apiClient.get<{ data: SyncStatus }>('/sync/status', { credentials: 'include' })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return NextResponse.json(`Unable to get the sync status. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
