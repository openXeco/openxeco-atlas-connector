'use server'

import { getApiClient } from '@/lib/api-client'
import type { SyncLog } from '@/types'
import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { handleRouteError } from '@/lib/errors'

export async function GET(req: NextRequest) {
  try {
    const apiClient = getApiClient()
    const response = await apiClient.get<{
      data: SyncLog[]
      meta: { page: number; limit: number; count: number; total: number }
    }>(`/sync/logs?${req.nextUrl.searchParams.toString()}`, { credentials: 'include' })

    return NextResponse.json(response)
  } catch (e) {
    logger.error(e)
    const { message, statusCode } = handleRouteError(e, logger)
    return NextResponse.json(message, { status: statusCode })
  }
}
