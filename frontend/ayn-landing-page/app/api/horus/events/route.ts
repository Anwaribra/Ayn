/**
 * Proxies Horus SSE to the backend without buffering (same pattern as chat/stream).
 * Forwards Cookie and Authorization from the browser request.
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const incoming = new URL(req.url)
  const backendUrl = new URL(`${BACKEND_URL}/api/horus/events`)
  incoming.searchParams.forEach((v, k) => {
    if (k.toLowerCase() === "token" || k.toLowerCase() === "access_token") return
    backendUrl.searchParams.set(k, v)
  })

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? ""
  const cookie = req.headers.get("cookie") ?? ""

  let backendResponse: Response
  try {
    backendResponse = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        Accept: "text/event-stream",
      },
      cache: "no-store",
    })
  } catch {
    return new NextResponse("Backend unreachable", { status: 502 })
  }

  if (!backendResponse.ok) {
    const errText = await backendResponse.text().catch(() => "Upstream error")
    return new NextResponse(errText, {
      status: backendResponse.status,
      headers: { "Content-Type": "text/plain" },
    })
  }

  return new NextResponse(backendResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
