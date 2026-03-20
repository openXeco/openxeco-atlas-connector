import { getApiClient } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function GET() {
  const apiClient = await getApiClient()

  try {
    const user = await apiClient.getCurrentUser()

    if (!user) {
      await apiClient.logoutUser()
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json({ data: user })
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Needed
    console.error(e)
    await apiClient.logoutUser()
    return NextResponse.json({ error: (e as Error).message }, { status: 401 })
  }
}
