import type { NextConfig } from 'next'

const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:3001'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
  ],
}

export default nextConfig
