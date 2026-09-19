'use server'

import { NextResponse } from 'next/server'
import type { GeneralSettings } from '@/types'
import { getApiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { handleRouteError } from '@/lib/errors'

export async function GET() {
  try {
    const apiClient = getApiClient()
    const generalResponse = await apiClient.get<GeneralSettings>('/settings/general', { credentials: 'include' })

    return NextResponse.json({ data: { general: generalResponse } })
  } catch (e) {
    return handleRouteError(e, logger)
  }
}
