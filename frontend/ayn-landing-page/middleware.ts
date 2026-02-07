import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const PROTECTED_PATHS = [
  "/platform/dashboard",
  "/platform/overview",
  "/platform/horus-ai",
  "/platform/evidence",
  "/platform/assessments",
  "/platform/standards",
  "/platform/gap-analysis",
  "/platform/archive",
  "/platform/settings",
]

// Routes that should redirect authenticated users (auth pages)
const AUTH_PATHS = ["/platform/login", "/platform/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for access token in cookies (server-side check)
  // Note: The token is stored in localStorage client-side,
  // so we use a cookie-based approach for middleware checks
  const token = request.cookies.get("access_token")?.value

  // Check if path is protected
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )

  // Check if path is an auth page
  const isAuthPage = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )

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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
