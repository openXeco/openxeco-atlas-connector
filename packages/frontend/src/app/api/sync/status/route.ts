'use server'

import { NextResponse } from 'next/server'
import type { SyncRecap } from '@/types'
import { getApiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { handleRouteError } from '@/lib/errors'

export async function GET() {
  try {
    const apiClient = getApiClient()
    const response = await apiClient.get<{ data: SyncRecap }>('/entities/status', { credentials: 'include' })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    logger.error(e)
    const { message, statusCode } = handleRouteError(e, logger)
    return NextResponse.json(message, { status: statusCode })
  }
}
