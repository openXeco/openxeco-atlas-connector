import { login } from '@/data/auth'
import { NextResponse, NextRequest } from 'next/server'
import { createSession } from '@/app/actions/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  try {
    const { accessToken, refreshToken, refreshTokenExpiresIn, user } = await login(email, password)

    await createSession(refreshToken, refreshTokenExpiresIn)

    return NextResponse.json({ user, accessToken })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to login'
    return NextResponse.json({ message }, { status: 401 })
  }
}
