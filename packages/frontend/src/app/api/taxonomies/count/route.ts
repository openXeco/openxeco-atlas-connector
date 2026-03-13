'use server'

import { NextResponse } from 'next/server'
import { apiClientBackend } from '@/lib/api-backend'

export async function GET() {
  try {
    const response = await apiClientBackend.get<{ data: { total: number } }>('/api/taxonomies/count', {
      credentials: 'include',
    })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return NextResponse.json(`Unable to get the taxonomies. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
