import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/firebase-admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip authentication for login, register and API auth routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Check for Firebase authentication token
  const token = request.cookies.get('firebase-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify the Firebase ID token
    const decoded = await verifyFirebaseToken(token)
    
    if (!decoded) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-user-email', decoded.email || '')
    response.headers.set('x-user-id', decoded.uid)
    response.headers.set('x-user-name', decoded.name || '')
    
    return response
  } catch (error) {
    console.error('Firebase token verification failed:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - api/login (login API route)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - register (register page)
     */
    '/((?!api/auth|api/login|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}
