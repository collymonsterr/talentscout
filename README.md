# ExpertScout

Find hidden experts by what they actually know.

ExpertScout searches public Reddit discussions to find people who repeatedly demonstrate practical expertise. Describe the expert you need, and the app identifies, scores, and ranks candidates based on their public contributions.

## Setup

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- OpenAI API key

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
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `OPENAI_API_KEY` — OpenAI API key

Optional:
- `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` — for authenticated Reddit API (not required, public JSON endpoints work for MVP)

### Database

Run the SQL migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project using the SQL editor in the Supabase dashboard.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Describe** the expert you need in natural language
2. **Search** — the app generates structured criteria and searches Reddit
3. **Analyse** — contributors are grouped, scored, and ranked
4. **Review** — see ranked candidates with evidence and scores
5. **Save** — add promising candidates to your bench

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres)
- OpenAI API
- Reddit public JSON endpoints

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design
- [PRODUCT.md](PRODUCT.md) — product spec
- [DATABASE.md](DATABASE.md) — schema documentation
- [API.md](API.md) — API route documentation
- [DECISIONS.md](DECISIONS.md) — decision log
- [ROADMAP.md](ROADMAP.md) — future plans
- [TODO.md](TODO.md) — current work tracking
