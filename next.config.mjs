/**@type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'original-raven-648.convex.cloud'
      },
      {
        protocol: 'https',
        hostname: 'original-raven-648.convex.cloud'
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com'
      },
      {
        protocol: 'https',
        hostname: 'https://original-raven-648.convex.cloud'
      }
    ]
  }
};

export default nextConfig;
