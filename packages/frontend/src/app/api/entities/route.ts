'use server'

import { NextResponse, type NextRequest } from 'next/server'
import { getApiClient } from '@/lib/api-client'
import type { Entity } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const apiClient = await getApiClient()
    const response = await apiClient.get<{ data: Entity[] }>(`/entities?${req.nextUrl.searchParams.toString()}`, {
      credentials: 'include',
    })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return NextResponse.json(
      { message: `Unable to get the sync status. Reason: ${(e as Error).message}` },
      { status: 500 },
    )
  }
}
