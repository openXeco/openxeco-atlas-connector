'use server'

import { NextResponse, NextRequest } from 'next/server'
import { apiClientBackend } from '@/lib/api-backend'
import { Entity } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const response = await apiClientBackend.get<{ data: Entity[] }>(
      `/api/entities?${req.nextUrl.searchParams.toString()}`,
      { credentials: 'include' }
    )

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return NextResponse.json({message: `Unable to get the sync status. Reason: ${(e as Error).message}`}, { status: 500 })
  }
}
