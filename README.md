# Telegram Trend & Pain-Point Radar (Elak)

> A production-grade, portfolio-quality Telegram bot SaaS that curates and delivers digestible twice-daily digests from public Telegram channels.

## Overview

People following numerous niche Telegram channels often suffer from information overload. Telegram Radar allows users to select topics of interest, specify public Telegram channels they follow, and receive exactly two short, scannable digests per day in Uzbek with direct links (`Batafsil: ...`) back to the original source posts.

## Architecture

This project is structured as a **Turborepo** monorepo using **pnpm**:

- `apps/bot`: Telegram Bot service built with Node.js and TypeScript (onboarding, commands, and rate-limited digest delivery).
- `apps/worker`: Background worker responsible for scheduled channel fetching (deduplicated & cached), LLM-based summarization (Uzbek), and digest assembly.
- `apps/admin`: Private admin dashboard built with Next.js (App Router), Tailwind CSS, and shadcn/ui.
- `packages/database`: Unified Prisma schema and client shared across bot, worker, and admin apps.
- `packages/shared-types`: Common TypeScript definitions, interfaces, and enums.

## Quick Start

Detailed setup and architecture instructions will be added as phases progress. See `ARCHITECTURE.md` for architecture diagrams and design specifications.
