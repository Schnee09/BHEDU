import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Tree-shake barrel exports from heavy icon/chart libraries
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'date-fns',
    ],
  },

  // Provide safe defaults for public envs to avoid build-time crashes when unset in CI
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.com',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key',
  },
  outputFileTracingRoot: __dirname,

  // Silence workspace root warning from multiple lockfiles in monorepo
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  turbopack: {
    root: __dirname,
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              `connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.sentry.io ${
                process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'wss://')} ${process.env.NEXT_PUBLIC_SUPABASE_URL}`
                  : ''
              }`.trim(),
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withAnalyzer(nextConfig), {
  // Sentry Webpack Plugin options
  silent: true,
  org: 'bh-edu',
  project: 'bh-edu-web',
});
