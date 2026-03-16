import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ayn-production.up.railway.app"
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ayn.vercel.app"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    const errorDesc = searchParams.get("error_description") || error
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDesc)}`, BASE_URL)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", BASE_URL))
  }

  // Use exact URL we were called with (without query) — must match what we sent to Google
  const reqUrl = new URL(request.url)
  const redirectUri = `${reqUrl.origin}${reqUrl.pathname.replace(/\/$/, "")}`

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/google/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data.detail || (typeof data.detail === "string" ? data.detail : "Auth failed")
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(msg)}`, BASE_URL)
      )
    }

    const { access_token, user } = data
    const url = new URL("/login", BASE_URL)
    url.searchParams.set("token", access_token)
    url.searchParams.set("google_login", "1")
    return NextResponse.redirect(url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection error"
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, BASE_URL)
    )
  }
}
