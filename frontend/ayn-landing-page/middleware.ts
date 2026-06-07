import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/platform") {
    return NextResponse.redirect(new URL("/platform/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/platform/:path*"],
}
