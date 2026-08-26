import { type NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export function proxy(request: NextRequest) {
  logger.debug('Entering the proxy', request.nextUrl.pathname)
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
  matcher: [
    '/((?!api(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)|\\.well-known(?:/|$)|favicon\\.ico$|sitemap\\.xml$|robots\\.txt$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
}
