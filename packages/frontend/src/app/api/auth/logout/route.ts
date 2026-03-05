import { NextResponse } from 'next/server'
import { destroySession } from '@/app/actions/auth'

export async function POST() {
  await destroySession()

  return NextResponse.json({ message: 'Successfully logged out.' })
}
