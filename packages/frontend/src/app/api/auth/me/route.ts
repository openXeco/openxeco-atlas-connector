import { getUserInfo } from '@/data/auth'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization')

    if (!authorization) {
      return NextResponse.json({ message: 'Failed to get the user. No Authorization header provided'  }, { status: 401 })
    }

    const user = await getUserInfo(authorization.split(' ')[1])

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to get the user', error }, { status: 401 })
  }
}
