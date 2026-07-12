# =============================================
# Setup Production Config Files
# =============================================

$root = "C:\Projects\reconciliation-saas"
Set-Location $root

Write-Host "Setting up Production Configuration Files..." -ForegroundColor Cyan

# 1. next.config.ts
@"
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    turbopack: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
"@ | Out-File -FilePath "$root\next.config.ts" -Encoding utf8 -Force

# 2. tailwind.config.ts
@"
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
"@ | Out-File -FilePath "$root\tailwind.config.ts" -Encoding utf8 -Force

# 3. .env.example
@"
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase Edge Functions
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
"@ | Out-File -FilePath "$root\.env.example" -Encoding utf8 -Force

# 4. ARCHITECTURE.md
@"
# ReconFlow Architecture

**Last Updated:** $(Get-Date)

## Current Structure
- **App Router**: `src/app/` (main pages)
- **Components**: `src/components/`
- **Backend**: `supabase/functions/`
- **Lib**: `src/lib/`

## Production Status
- Next.js 16 + Turbopack: ✅
- Supabase + Edge Functions: ✅
- shadcn/ui: ✅

## Next Development Goals
1. Implement full RLS policies
2. Add tests (Jest + Playwright)
3. Setup Docker + CI/CD
4. Add error monitoring (Sentry)
"@ | Out-File -FilePath "$root\ARCHITECTURE.md" -Encoding utf8 -Force

Write-Host "✅ All production config files created successfully!" -ForegroundColor Green
Write-Host "Files created: next.config.ts, tailwind.config.ts, .env.example, ARCHITECTURE.md" -ForegroundColor White

pause