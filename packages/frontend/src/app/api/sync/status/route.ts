'use server'

import { NextResponse } from 'next/server'
import { apiClientBackend } from '@/lib/api-backend'
import { SyncStatus } from '@/types'

export async function GET() {
  try {
    const response = await apiClientBackend.get<{ data: SyncStatus }>('/api/sync/status', { credentials: 'include' })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return NextResponse.json(`Unable to get the sync status. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
