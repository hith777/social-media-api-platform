import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Protected routes that require authentication
 */
const protectedRoutes = ['/feed', '/profile', '/notifications', '/search']

/**
 * Auth routes that should redirect to feed if already authenticated
 */
const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth token in cookies (Zustand persist stores in localStorage,
  // but we can check cookies as a fallback for server-side checks)
  // Note: Client-side protection is handled by ProtectedRoute component
  const authCookie = request.cookies.get('auth-storage')
  const hasAuth = !!authCookie

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if route is auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // For protected routes, we'll let client-side handle the redirect
  // since we can't access localStorage in middleware
  // This middleware mainly handles cookie-based checks

  // Redirect to feed if accessing auth route while authenticated (cookie check)
  if (isAuthRoute && hasAuth) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

