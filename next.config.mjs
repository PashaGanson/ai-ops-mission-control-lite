/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // HTML pages — no cache, always fresh
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        // Static JS/CSS chunks — cache by hash (safe, hash changes on rebuild)
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
