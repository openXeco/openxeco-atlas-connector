import { type NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function middleware(request: NextRequest) {
  logger.debug('Entering middleware', request.nextUrl.pathname)
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|favicon|_next/static|.well-known|_next/image|.*\.png$).*)'],
}
