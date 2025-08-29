/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Origin-Agent-Cluster', value: '?1' },
];

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: [
      'react', 'react-dom', 'lucide-react'
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Exclude server-side modules from client-side bundles
    config.resolve.fallback = {
      fs: false,
      module: false,
    };
    // Strip console.* in production client builds for smaller/faster bundles
    if (!dev && !isServer) {
      if (!config.optimization) config.optimization = {};
      if (!config.optimization.minimizer) config.optimization.minimizer = [];
      // Find existing Terser plugin
      const terser = config.optimization.minimizer.find(m => m && m.constructor && m.constructor.name === 'TerserPlugin');
      if (terser && terser.options && terser.options.terserOptions) {
        terser.options.terserOptions.compress = {
          ...(terser.options.terserOptions.compress || {}),
          drop_console: true,
        };
      }
    }
  return config;
  },
};

export default nextConfig;