import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Vercel requires rewrite destinations to start with /, http://, or https:// */
function normalizeBackendUrl(raw) {
  const fallback = "http://127.0.0.1:8000"
  if (!raw || typeof raw !== "string") return fallback
  const trimmed = raw.trim().replace(/\/+$/, "")
  if (!trimmed) return fallback
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `https://${trimmed}`
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
  },
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  async rewrites() {
    const backendUrl = normalizeBackendUrl(
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ""
    )

    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    }
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
    ]
  },
}

export default nextConfig
