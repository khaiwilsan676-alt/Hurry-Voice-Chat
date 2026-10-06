/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/Hurry-Voice-Chat',

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  poweredByHeader: false,
};

export default nextConfig
