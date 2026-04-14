import { type NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/api-client'

export async function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(process.env.FRONTEND_SESSION_COOKIE_NAME || 'atlas-session')

  if (!hasSession && request.nextUrl.pathname !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname !== '/login') {
    // Verify access token expiration
    const apiClient = await getApiClient()
    await apiClient.verifySession()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|.well-known|_next/image|.*\\.png$).*)'],
}
