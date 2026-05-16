# ExpertScout

Find hidden experts by what they actually know.

ExpertScout searches public Reddit discussions to find people who repeatedly demonstrate practical expertise. Describe the expert you need, and the app identifies, scores, and ranks candidates based on their public contributions — with direct links to their Reddit profiles and a one-click message button.

**Live:** https://expert-scout.vercel.app

## Setup

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- OpenAI API key (with credits loaded)

### Install

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (Dashboard → Project Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase "Publishable key" (Dashboard home page)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase "Secret key" (Dashboard home page)
- `OPENAI_API_KEY` — OpenAI API key

Optional:
- `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` — for authenticated Reddit API (not required, public JSON endpoints work for MVP)

### Database

Run the SQL migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project:
1. Open Supabase Dashboard → SQL Editor
2. Paste the contents of the migration file
3. Click "Run"

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Describe** the expert you need in natural language
2. **AI generates criteria** — skills, tools, subreddits, and search phrases
3. **Reddit search** — finds high-signal posts and comments across relevant subreddits
4. **AI scores candidates** — groups evidence by user, scores on 6 dimensions
5. **Review results** — ranked candidates with summaries, strengths, and Reddit links
6. **Take action** — view their Reddit profile, message them directly, or save to bench

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Supabase** (Postgres) — 6 tables
- **OpenAI API** — gpt-4o-mini for criteria, gpt-4o for scoring
- **Reddit public JSON** — no OAuth needed
- **Vercel** — deployment with auto-deploy from GitHub

## Project structure

```
src/app/                        # Pages and API routes
  page.tsx                      # Homepage
  search/[id]/page.tsx          # Search results + pipeline
  candidates/[id]/page.tsx      # Candidate detail
  bench/page.tsx                # Saved candidates
  api/                          # 9 API routes
src/lib/                        # Shared utilities
  types.ts                      # TypeScript interfaces
  supabase.ts                   # DB client (lazy init)
  openai.ts                     # AI client + functions
  reddit.ts                     # Reddit search client
src/components/ui/              # shadcn/ui components
supabase/migrations/            # SQL schema
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design, data flow, deployment
- [PRODUCT.md](PRODUCT.md) — product spec, pages, scoring dimensions
- [DATABASE.md](DATABASE.md) — complete schema documentation
- [API.md](API.md) — all 9 API routes with inputs/outputs
- [DECISIONS.md](DECISIONS.md) — architectural decision log
- [ROADMAP.md](ROADMAP.md) — what's done, what's next
- [TODO.md](TODO.md) — current work status
- [CLAUDE.md](CLAUDE.md) — Claude Code project context
