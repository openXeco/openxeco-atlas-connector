import { NextResponse } from 'next/server'
import { getApiClient } from '@/lib/api-client'
import { User } from '@/types'

export async function GET() {
  try {
    const apiClient = getApiClient()
    const response = await apiClient.get<{ data: User[] }>('/users', { credentials: 'include' })

    return NextResponse.json({ data: response.data })
  } catch (_e) {
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 })
  }
}
