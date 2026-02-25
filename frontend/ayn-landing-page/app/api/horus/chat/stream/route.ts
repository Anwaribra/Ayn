/**
 * Streaming proxy for Horus chat.
 *
 * WHY THIS EXISTS:
 * next.config.mjs uses Next.js rewrites() to forward /api/* to the Railway backend.
 * Next.js rewrites BUFFER the entire response before forwarding it to the browser,
 * which breaks streaming — the user sees all tokens appear at once when the response
 * is complete instead of word-by-word.
 *
 * This Route Handler intercepts POST /api/horus/chat/stream BEFORE the rewrite
 * and manually pipes the backend ReadableStream directly to the browser response,
 * giving true word-by-word streaming.
 *
 * The Route Handler takes priority over rewrites() for the same path.
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ayn-production.up.railway.app"

export const runtime = "nodejs"  // Needed for streaming support
export const dynamic = "force-dynamic"  // Never cache this route

export async function POST(req: NextRequest) {
  // Forward the raw FormData body (includes message, chat_id, files) as-is
  const formData = await req.formData()

  // Pass through the Authorization header from the original request
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? ""

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${BACKEND_URL}/api/horus/chat/stream`, {
      method: "POST",
      headers: {
        // Do NOT set Content-Type — fetch sets multipart/form-data boundary automatically
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: formData,
      // @ts-ignore — Node 18+ supports this; prevents Node from buffering the response
      duplex: "half",
    })
  } catch (err) {
    return new NextResponse("Backend unreachable", { status: 502 })
  }

  if (!backendResponse.ok) {
    const errorText = await backendResponse.text().catch(() => "Upstream error")
    return new NextResponse(errorText, {
      status: backendResponse.status,
      headers: { "Content-Type": "text/plain" },
    })
  }

  // Pipe the backend ReadableStream directly to the browser.
  // This is the key fix: we never buffer — we pass through each chunk immediately.
  return new NextResponse(backendResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Tell Nginx/Vercel/CDN to NOT buffer this response
      "X-Accel-Buffering": "no",
      // Prevent any intermediate caching of the stream
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      // Allow browser to read partial responses
      "Transfer-Encoding": "chunked",
    },
  })
}
