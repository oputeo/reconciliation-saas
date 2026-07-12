// next.config.ts
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Allow LAN IP access during live demos (fixes HMR WebSocket over 10.x.x.x)
  allowedDevOrigins: ['10.199.220.251', 'localhost', '127.0.0.1'],
  reactStrictMode: true,

  // Sentry merges trace meta into the HTML head; keep off to avoid hydration drift.
  experimental: {
    clientTraceMetadata: [],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  poweredByHeader: false,
  compress: true,

  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG ?? 'oeosolution',
  project: process.env.SENTRY_PROJECT ?? 'reconflow',
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  },
});