import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(process.env.FRONTEND_SESSION_COOKIE_NAME || 'atlas-session')
  // console.debug('Request', request.nextUrl.href)

  if (!hasSession && request.nextUrl.pathname !== '/login') {
    // console.debug('No session - url !== login')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && request.nextUrl.pathname === '/login') {
    // console.debug('Session - url === login')
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // console.debug('Session - everything fine')
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
