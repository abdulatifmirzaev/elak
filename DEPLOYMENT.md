# Production Deployment Guide

This guide details how to deploy **Telegram Trend & Pain-Point Radar** into production across modern cloud providers:

- **Database**: Managed PostgreSQL on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)
- **Bot & Worker Services**: [Railway](https://railway.app/) or [Render](https://render.com/)
- **Admin Dashboard**: [Vercel](https://vercel.com/)

---

## 1. Database Provisioning (Neon / Supabase)

1. Create a PostgreSQL project on Neon or Supabase.
2. Retrieve your connection string with pooling/SSL:
   ```text
   DATABASE_URL="postgresql://user:password@ep-host.region.aws.neon.tech/telegram_radar?sslmode=require"
   ```
3. Run migrations and seed from your local terminal:
   ```bash
   DATABASE_URL="<YOUR_REMOTE_URL>" pnpm db:push
   DATABASE_URL="<YOUR_REMOTE_URL>" pnpm db:seed
   ```

---

## 2. Deploying Bot & Worker on Railway / Render

### Option A: Railway

1. Create a new Railway project and connect your GitHub repository (`abdulatifmirzaev/elak`).
2. Add **Service 1 (Bot)**:
   - Config path: `Dockerfile.bot`
   - Set Environment Variables:
     - `DATABASE_URL`: Your remote PostgreSQL URL
     - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot token from `@BotFather`
     - `NODE_ENV`: `production`
3. Add **Service 2 (Worker)**:
   - Config path: `Dockerfile.worker`
   - Set Environment Variables:
     - `DATABASE_URL`: Your remote PostgreSQL URL
     - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot token
     - `ANTHROPIC_API_KEY`: Your Anthropic API key
     - `LLM_MODEL`: `claude-3-5-haiku-latest`
     - `CRON_SCHEDULE`: `0 9,20 * * *`
     - `SCHEDULE_TIMEZONE`: `Asia/Tashkent`
     - `NODE_ENV`: `production`

### Option B: Render Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com/) > **Blueprints**.
2. Connect `https://github.com/abdulatifmirzaev/elak.git`.
3. Render will parse `render.yaml` and provision:
   - `radar-postgres`: Managed PostgreSQL
   - `telegram-radar-bot`: Persistent worker running the bot
   - `telegram-radar-worker`: Persistent daemon running the twice-daily scheduler

---

## 3. Deploying Admin Dashboard on Vercel

1. Import the repository `abdulatifmirzaev/elak` into [Vercel](https://vercel.com/new).
2. Configure project settings:
   - **Root Directory**: `apps/admin`
   - **Framework Preset**: Next.js
   - **Build Command**: `cd ../.. && pnpm --filter @radar/database db:generate && pnpm --filter @radar/admin build`
   - **Install Command**: `pnpm install`
3. Set Environment Variables:
   - `DATABASE_URL`: Remote PostgreSQL connection string
   - `ADMIN_PASSWORD`: A secure password for founder dashboard access
   - `NEXTAUTH_SECRET`: Random 32-character string
4. Click **Deploy**. Your dashboard will be live at `https://your-project.vercel.app`.

---

## 4. Local Containerized Run (Docker Compose)

To run the entire ecosystem locally with Docker:

```bash
# Provide environment variables in .env, then run:
docker compose up --build
```
