import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Disable dev indicators overlay in local dev mode to prevent overlapping mobile bottom bar
  devIndicators: false,

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
              `script-src 'self' 'unsafe-inline'${
                process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
              } https://va.vercel-scripts.com`,
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

const analyzedConfig = withAnalyzer(nextConfig);

// The Sentry build plugin is expensive to load on slow Windows filesystems and
// is only needed for production instrumentation/source-map uploads.
const finalConfig =
  process.env.NODE_ENV === 'development'
    ? analyzedConfig
    : withSentryConfigForProduction(analyzedConfig);

function withSentryConfigForProduction(config: NextConfig): NextConfig {
  const { withSentryConfig } =
    require('@sentry/nextjs/config') as typeof import('@sentry/nextjs/config');
  return withSentryConfig(config, {
    silent: true,
    org: 'bh-edu',
    project: 'bh-edu-web',
  });
}

export default finalConfig;
