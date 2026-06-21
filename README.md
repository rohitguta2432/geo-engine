# EchoRank — GEO (Generative Engine Optimization) Engine

Search is collapsing from ten blue links into a single AI answer. **EchoRank** measures whether AI answer-engines — Claude, ChatGPT, Perplexity, Google AI Overviews — recommend and cite *your* brand or your competitors, then auto-generates the content to close the gap, and tracks your visibility lift over time.

## The loop

1. **Audit** — generate ~12 buyer-intent queries for your category and ask each engine, recording who gets surfaced and cited.
2. **Diagnose** — a 0–100 **Visibility Score**, a share-of-voice leaderboard, a **cited-source leaderboard** (the domains the engines actually pull answers from, tagged as you / a rival / a third-party target), and the exact **gap prompts** where rivals win and you're invisible.
3. **Generate** — one click writes citation-optimized FAQ pages, comparisons, and listicles, each with Schema.org JSON-LD.
4. **Track** — re-run the audit after publishing to chart your lift.

## Run it locally

Requires Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local      # add ANTHROPIC_API_KEY
pnpm dev                        # http://localhost:3000
```

The app boots with **nothing configured** (you'll get template prompts and a "set a key" banner). To run a real audit, set **`ANTHROPIC_API_KEY`** — that alone is enough. A local **Ollama** (`OLLAMA_HOST`) is used for free, high-volume prompt generation and falls back to Claude when absent.

Everything else is optional and degrades gracefully:

| Capability | Env | Without it |
| --- | --- | --- |
| Claude answer engine | `ANTHROPIC_API_KEY` | app still loads; can't audit |
| Free local generation | `OLLAMA_HOST` | falls back to Claude |
| Perplexity engine | `PERPLEXITY_API_KEY` | engine hidden |
| ChatGPT engine | `OPENAI_API_KEY` | engine hidden |
| Google AI Overview | `SERPAPI_KEY` | engine hidden |
| Google indexing ping | `GOOGLE_INDEXING_SA` | publish step skipped |
| Billing / plan tiers | `STRIPE_SECRET_KEY` | unlimited **local** plan |

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind v4**
- **better-sqlite3** for zero-setup local persistence (swap for Postgres/Supabase in prod)
- **@anthropic-ai/sdk** with the web-search server tool as the reference answer engine
- Pluggable `AnswerEngine` registry — each engine self-reports `available()` from its credentials
- Background audit job writes progress to SQLite; the dashboard polls (swap for Inngest/queue in prod)

## Architecture

```
src/lib/
  config.ts            feature flags from env (everything optional)
  db.ts / repo.ts      better-sqlite3 schema + typed CRUD
  llm/                 anthropic, ollama, unified gen + JSON extraction
  engines/             answer-engine registry (claude, perplexity, openai, google-aio)
  audit/               prompts -> run (probe+detect) -> score (SoV, gaps) -> view
  content/             citation-optimized asset generation + Schema.org JSON-LD
  publish/indexing.ts  Google Indexing API ping (JWT via service account)
src/app/
  page.tsx             landing + audit form
  audit/[id]/          results dashboard (polls while running)
  api/                 audit · audit/[id] · generate · reaudit · publish
```

## API

| Route | Method | Body | Returns |
| --- | --- | --- | --- |
| `/api/audit` | POST | `{ brand, domain, category, competitors[], engines?, promptCount? }` | `{ projectId, auditId }` |
| `/api/audit/[id]` | GET | — | `{ audit, project, score, lift, results }` |
| `/api/generate` | POST | `{ projectId, auditId?, prompt, type }` | the saved `Asset` |
| `/api/reaudit` | POST | `{ projectId, engines?, promptCount? }` | `{ projectId, auditId }` |
| `/api/publish` | POST | `{ urls[], type? }` | per-URL indexing result |

## Production swaps

- **DB**: better-sqlite3 → Postgres/Supabase (repo.ts is the only file to touch).
- **Jobs**: fire-and-forget → Inngest / queue for durability across deploys.
- **Billing**: set Stripe envs to enable the `free / starter / growth / pro` tiers in `src/lib/plan.ts`.
