import { NextResponse } from 'next/server'
import { apiClientBackend } from '@/lib/api-backend'
import { User } from '@/types'

export async function GET() {
  try {
    const response = await apiClientBackend.get<{ data: User[] }>('/api/users', { credentials: 'include' })

    return NextResponse.json({ data: response.data })
  } catch (_e) {
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 })
  }
}
