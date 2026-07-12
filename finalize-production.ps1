# =============================================
# Final Production Setup for ReconFlow
# =============================================

$root = "C:\Projects\reconciliation-saas"
Set-Location $root

Write-Host "Finalizing ReconFlow for Production..." -ForegroundColor Cyan

# 1. Create .dockerignore
@"
node_modules
.next
.git
.env.local
*.csv
*.ps1
*.bat
"@ | Out-File -FilePath "$root\.dockerignore" -Encoding utf8 -Force

# 2. Create Dockerfile
@"
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
"@ | Out-File -FilePath "$root\Dockerfile" -Encoding utf8 -Force

# 3. Create docker-compose.yml
@"
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped

  supabase:
    image: supabase/postgres
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
"@ | Out-File -FilePath "$root\docker-compose.yml" -Encoding utf8 -Force

# 4. Update README.md
@"
# ReconFlow - Revenue Recovery & Reconciliation Platform

Production-ready AI-powered reconciliation system.

## Tech Stack
- Next.js 16 (App Router + Turbopack)
- Supabase (Database + Edge Functions)
- TypeScript + Tailwind + shadcn/ui
- Recharts for analytics

## Quick Start
```bash
npm install
npm run dev