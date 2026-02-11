import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Note: Authentication is handled client-side via localStorage.
// The PROTECTED_PATHS logic has been removed because:
// 1. Tokens are stored in localStorage (client-side only)
// 2. Middleware runs server-side and cannot access localStorage
// 3. Client-side ProtectedRoute components handle auth checks

export function middleware(request: NextRequest) {
  // Add security headers to all responses
  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes (handled by rewrites, not middleware)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
