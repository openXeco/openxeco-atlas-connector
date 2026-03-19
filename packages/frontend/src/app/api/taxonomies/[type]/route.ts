'use server'

import { NextResponse, NextRequest } from 'next/server'
import { getApiClient } from '@/lib/api-client'

export async function GET(req: NextRequest, ctx: RouteContext<'/api/taxonomies/[type]'>) {
  const { type } = await ctx.params

  try {
    const apiClient = await getApiClient()
    const response = await apiClient.get<{ data: { total: number } }>(`/taxonomies/${type}`, {
      credentials: 'include',
    })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return NextResponse.json(`Unable to get the taxonomies. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
