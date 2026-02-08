/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
  },
  trailingSlash: true,

  // Proxy all /api/* requests to the backend.
  // This eliminates CORS entirely — the browser sees same-origin requests.
  // We use beforeFiles rewrites so they run BEFORE trailingSlash redirects.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ayn-production.up.railway.app"
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
            value: "DENY",
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
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

export default nextConfig
