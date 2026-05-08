/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'],
    },
  },
};

export default nextConfig;
