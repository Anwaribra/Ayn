import { NextResponse, type NextRequest } from "next/server"

const FROZEN_PLATFORM_PREFIXES = [
  "/platform/archive",
  "/platform/calendar",
  "/platform/notifications",
  "/platform/workflows",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/platform" || pathname === "/platform/dashboard") {
    return NextResponse.redirect(new URL("/platform/evidence", request.url))
  }

  if (FROZEN_PLATFORM_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/platform/evidence", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/platform/:path*"],
}
