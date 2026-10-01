# Telegram Trend & Pain-Point Radar (`elak-radar`)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.4-ef4444.svg)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-12.5-f97316.svg)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![grammY](https://img.shields.io/badge/grammY-1.35-24A1DE.svg)](https://grammy.dev/)
[![Claude](https://img.shields.io/badge/Claude_3.5_Haiku-Anthropic-7C3AED.svg)](https://anthropic.com/)

> A production-grade, portfolio-quality Telegram bot SaaS that curates, deduplicates, and delivers twice-daily AI digests from public Telegram channels in Uzbek.

---

## 📌 The Problem

People following 10–20+ niche Telegram channels (tech news, startups, career opportunities, AI updates, business) are overwhelmed by the relentless volume of posts. Important updates get buried under hundreds of messages, while constantly checking channels throughout the day kills focus and productivity.

## 💡 The Solution

**Telegram Radar** is an intelligent assistant where users:

1. Select topics of interest (_Texnologiya, Startap, Karyera, AI, Biznes, Ta'lim, Dasturlash, Kripto & Moliya, Marketing_).
2. Add up to 15 public Telegram channels they follow (via `@username` or forwarded posts).
3. Receive **exactly two digestible summaries per day** (morning 09:00 and evening 20:00). Each update is concisely paraphrased into **1–2 sentences in Uzbek** and ends with a direct link back to the source (`Batafsil: [link]`).

---

## 🏗 System Architecture

For a comprehensive technical walkthrough, data flows, and component specs, see [**ARCHITECTURE.md**](./ARCHITECTURE.md).

```text
telegram-radar/
├── apps/
│   ├── bot/                  # Telegram bot service (grammY, onboarding, commands, delivery)
│   ├── worker/               # Scheduled scraper, Claude LLM pipeline, digest builder, throttled queue
│   └── admin/                # Founder admin portal (Next.js 15 App Router, Tailwind CSS)
├── packages/
│   ├── database/             # Prisma schema, migrations, seed scripts, singleton client
│   └── shared-types/         # Domain DTOs, interfaces, and shared types
├── turbo.json                # Turborepo task pipeline
└── pnpm-workspace.yaml       # pnpm monorepo workspace definition
```

---

## 🚀 Key Engineering Highlights

- **Telegram Compliance by Design**:
  - Outgoing message throttling: strictly enforces `~1 msg/sec` per chat and `~30 msgs/sec` global throughput.
  - Zero scraper abuse: public preview endpoint (`t.me/s/`) is heavily cached (30-min TTL) and throttled; channels are deduplicated across subscribers so each channel is fetched **at most once per cycle**.
  - Strict opt-in/opt-out: instant `/stop` command halts future dispatches immediately.
  - Copyright protection: posts are never copied verbatim; summaries are strictly original paraphrases with source attribution.
- **LLM Pipeline with Fallbacks**:
  - Anthropic Claude 3.5 Haiku integration with structured JSON extraction and retries with exponential backoff.
  - Built-in heuristic NLP fallback enabling full local execution and testing even without an external API key.
- **Full Uzbek Localization**:
  - Complete, natural Uzbek user onboarding flow, keyboard controls, command guides, and notifications.
- **Modern Founder Dashboard**:
  - Password-gated Next.js 15 dashboard showing live KPI metrics, a 14-day growth trend chart, user moderation, and channel health statuses.

---

## 🛠 Quick Start & Local Setup

### 1. Prerequisites

- **Node.js** v20+ (tested on Node v26)
- **pnpm** v10+ (v12 recommended)
- **PostgreSQL** running locally (or remote Supabase / Neon instance)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/abdulatifmirzaev/elak.git
cd elak

# Install dependencies across all monorepo workspaces
pnpm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/telegram_radar?schema=public"

# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

# Anthropic Claude (Optional for local testing - heuristic fallback will be used if omitted)
ANTHROPIC_API_KEY="your_anthropic_api_key"
LLM_MODEL="claude-3-5-haiku-latest"

# Admin Dashboard
ADMIN_PASSWORD="your_admin_secret_password"
```

### 4. Database Initialization & Seeding

```bash
# Push schema and generate Prisma client
pnpm db:push

# Run seed script to populate default Uzbek interests
pnpm db:seed
```

### 5. Running the Apps

#### Run Everything Concurrently via Turborepo:

```bash
pnpm dev
```

#### Run Services Individually:

```bash
# 1. Start Telegram Bot Service
pnpm --filter @radar/bot dev

# 2. Run Worker on-demand (single cycle)
RUN_ONCE=true pnpm --filter @radar/worker dev

# 3. Run Worker as persistent twice-daily scheduler daemon
pnpm --filter @radar/worker dev

# 4. Start Next.js Admin Dashboard (http://localhost:3000)
pnpm --filter @radar/admin dev
```

---

## 🧪 Testing

The repository features comprehensive unit tests covering channel sanitization, rate-limiting queues, summarization prompts, digest formatting, and the scheduler:

```bash
# Run all unit tests
pnpm --filter @radar/worker test
pnpm --filter @radar/bot test
```

---

## 📜 Available Bot Commands

| Command       | Description (Uzbek)                                        |
| :------------ | :--------------------------------------------------------- |
| `/start`      | Botni ishga tushirish va onboarding sozlamalarini boshlash |
| `/mychannels` | Kuzatilayotgan kanallar ro'yxati va ularni o'chirish       |
| `/addchannel` | Yangi ommaviy Telegram kanalini qo'shish                   |
| `/interests`  | Qiziqish mavzularini qayta tanlash                         |
| `/stop`       | Kunlik bülletenlar obunasini to'xtatish (tasdiqlash bilan) |
| `/help`       | Yordam va foydalanish qo'llanmasi                          |

---

## 📄 License

MIT © 2026 Abdulatif Mirzaev
