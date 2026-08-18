'use server'

import { NextResponse, type NextRequest } from 'next/server'
import { getApiClient } from '@/lib/api-client'
import type { Entity } from '@/types'
import { handleRouteError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const apiClient = getApiClient()
    const response = await apiClient.get<{ data: Entity[] }>(`/entities?${req.nextUrl.searchParams.toString()}`, {
      credentials: 'include',
    })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return handleRouteError(e, logger)
  }
}
