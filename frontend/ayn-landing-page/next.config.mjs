/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // If your repo name is not 'Ayn', change this to match your repo name
  // For example: if repo is 'my-ayn-project', use '/my-ayn-project'
  basePath: process.env.NODE_ENV === 'production' ? '/Ayn' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Ayn' : '',
}

export default nextConfig
