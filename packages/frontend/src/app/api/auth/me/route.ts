import { getApiClient } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function GET() {
  const apiClient = getApiClient()

  try {
    const user = await apiClient.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json({ data: user })
  } catch (e) {
    console.error('error in the route', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 401 })
  }
}
