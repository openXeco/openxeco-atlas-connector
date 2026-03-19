'use server'

import { NextResponse } from 'next/server'
import { getApiClient } from '@/lib/api-client'

export async function GET() {
  try {
    const apiClient = await getApiClient()
    const response = await apiClient.get<{ data: { total: number } }>('/taxonomies/count', {
      credentials: 'include',
    })

    return NextResponse.json({ data: response.data })
  } catch (e) {
    return NextResponse.json(`Unable to get the taxonomies. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
