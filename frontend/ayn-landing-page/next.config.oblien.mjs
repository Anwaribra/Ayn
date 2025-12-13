/** @type {import('next').NextConfig} */
// Configuration for Oblien deployment (Full Next.js, no static export)
const nextConfig = {
  // No output: 'export' - use full Next.js features
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable image optimization (Oblien supports it)
    unoptimized: false,
  },
  trailingSlash: true,
  // No basePath needed - Oblien handles subdomain routing
  // basePath: '', // Remove this for Oblien
  // assetPrefix: '', // Remove this for Oblien
}

export default nextConfig

