import { NextRequest, NextResponse } from "next/server"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export async function GET(request: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ayn.vercel.app"
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/auth/google/callback`

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  })

  const state = crypto.randomUUID()
  params.set("state", state)

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return NextResponse.redirect(googleAuthUrl)
}
