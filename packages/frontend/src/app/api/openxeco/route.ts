import { NextResponse } from 'next/server'
import { handleRouteError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { getApiClient } from '@/lib/api-client'

export async function GET() {
  try {
    const apiClient = getApiClient()
    const response = await apiClient.get<{ success: boolean }>('/openxeco', { credentials: 'include' })

    return NextResponse.json({ success: response.success })
  } catch (e) {
    return NextResponse.json(handleRouteError(e, logger))
  }
}
