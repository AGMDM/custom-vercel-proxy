import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseTokenEdge } from '@/lib/firebase-edge'

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

  console.log('Middleware: Checking authentication for', pathname)
  console.log('Middleware: Token present:', !!token)

  if (!token) {
    console.log('Middleware: No token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify the Firebase ID token (basic validation in Edge Runtime)
    console.log('Middleware: Attempting to verify token')
    const decoded = await verifyFirebaseTokenEdge(token)
    
    console.log('Middleware: Token verification result:', decoded ? 'Success' : 'Failed')
    
    if (!decoded) {
      console.log('Middleware: Token verification failed, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('Middleware: Authentication successful for user:', decoded.email)

    // Add user info to headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-user-email', decoded.email || '')
    response.headers.set('x-user-id', decoded.uid || '')
    response.headers.set('x-user-name', decoded.name || '')
    
    return response
  } catch (error) {
    console.error('Middleware: Firebase token verification failed:', error)
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
