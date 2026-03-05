import { refresh } from '@/data/auth'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createSession } from '@/app/actions/auth'

export async function POST() {
  const cookieStore = await cookies()
  const existingRefreshToken = cookieStore.get('refreshToken')?.value

  if (!existingRefreshToken) {
    return NextResponse.json({ message: 'Failed to refresh token. Token not present' }, { status: 401 })
  }

  try {
    const { accessToken, refreshToken, refreshTokenExpiresIn } = await refresh(existingRefreshToken)

    await createSession(refreshToken, refreshTokenExpiresIn)

    return NextResponse.json({ accessToken })
  } catch (error) {
    return NextResponse.json({ message: `Failed to refresh token ${(error as Error).message}` }, { status: 401 })
  }
}
