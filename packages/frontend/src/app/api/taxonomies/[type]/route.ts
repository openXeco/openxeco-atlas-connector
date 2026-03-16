'use server'

import { NextResponse, NextRequest } from 'next/server'
import { apiClientBackend } from '@/lib/api-backend'

export async function GET(req: NextRequest, ctx: RouteContext<'/api/taxonomies/[type]'>) {
  const { type } = await ctx.params

  try {
    const response = await apiClientBackend.get<{ data: { total: number } }>(`/api/taxonomies/${type}`, {
      credentials: 'include',
    })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return NextResponse.json(`Unable to get the taxonomies. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
