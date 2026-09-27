/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // Keep large icon/component packages out of the initial bundle where possible.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  poweredByHeader: false,
};

export default nextConfig
