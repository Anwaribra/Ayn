/** @type {import('next').NextConfig} */
// Configuration for Production deployment (Full Next.js, no static export)
const nextConfig = {
  // No output: 'export' - use full Next.js features
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable image optimization (Production server supports it)
    unoptimized: false,
  },
  trailingSlash: true,
  // No basePath needed - hosting handles subdomain routing
  // basePath: '', // Remove this for production
  // assetPrefix: '', // Remove this for production
}

export default nextConfig










