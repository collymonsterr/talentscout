# ExpertScout

## What this is
ExpertScout is an MVP web app that finds hidden experts on Reddit based on demonstrated expertise in public posts and comments. Users describe the expert they need, the app searches Reddit intelligently, scores candidates, and returns a ranked shortlist with direct links to message them.

## Tech stack
- Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Postgres) for database — service role key used server-side
- OpenAI API — gpt-4o-mini for criteria generation, gpt-4o for candidate scoring
- Reddit public JSON endpoints (no OAuth needed)
- Deployed on Vercel (project: expert-scout)

## Project structure
```
src/
  app/
    page.tsx                    # Homepage with search form + recent searches
    layout.tsx                  # Root layout with nav header
    search/[id]/page.tsx        # Search results with progress pipeline
    candidates/[id]/page.tsx    # Candidate detail with scores + evidence
    bench/page.tsx              # Saved candidates management
    api/
      searches/route.ts         # GET — list recent completed searches
      search/create/route.ts    # POST — create search + generate criteria
      search/reddit/route.ts    # POST — execute Reddit search
      search/[id]/route.ts      # GET — get search with criteria + candidates
      candidates/score/route.ts # POST — score candidates via OpenAI
      candidates/[id]/route.ts  # GET — get candidate with evidence
      candidates/save/route.ts  # POST — save candidate to bench
      bench/route.ts            # GET — list saved candidates
      bench/[id]/route.ts       # PATCH — update saved candidate
  lib/
    types.ts                    # TypeScript interfaces for all DB tables
    supabase.ts                 # Lazy-init Supabase client (Proxy pattern)
    openai.ts                   # Lazy-init OpenAI, criteria + scoring functions
    reddit.ts                   # Reddit public JSON search client
  components/ui/                # shadcn/ui components
supabase/migrations/            # SQL schema (run manually in Supabase SQL Editor)
```

## Key commands
- `npm run dev` — start dev server on localhost:3000
- `npm run build` — production build (Vercel auto-deploys on push to main)

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase "Publishable key" (was "anon key")
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase "Secret key" (was "service_role key")
- `OPENAI_API_KEY` — OpenAI API key (needs credits loaded)

## Architecture decisions
- No auth for MVP — single user, no login
- Reddit public JSON over OAuth — simpler, no credentials needed
- Sequential API flow: create search → search reddit → score candidates
- Frontend auto-triggers the full pipeline — user just waits
- Supabase direct via supabase-js (no ORM)
- All processing in API routes (no background jobs)
- Lazy-init pattern for Supabase and OpenAI clients to avoid build-time env errors
- API routes use `maxDuration = 120` for Reddit search and scoring (Vercel timeout)

## Pipeline flow
1. User submits brief on homepage → `POST /api/search/create`
2. Frontend redirects to `/search/[id]` which auto-runs the pipeline:
   - Criteria generated (OpenAI gpt-4o-mini) — ~10s
   - Reddit search (public JSON, up to 500 items) — ~1-2 min
   - Candidate scoring (OpenAI gpt-4o, batches of 5) — ~30s
3. Results page polls every 3s during processing, shows visual progress
4. Candidates displayed with scores, summaries, strengths, Reddit links
5. Candidate detail shows full evidence, score breakdown, outreach message

## Scoring weights
- Practicality: 30% — has actually built/implemented things
- Relevance: 25% — discusses requested topics/tools
- Specificity: 20% — mentions real tools, APIs, errors, tradeoffs
- Consistency: 15% — repeated evidence across threads
- Helpfulness: 10% — answers questions, advises others
- Recency: displayed separately (not in weighted score)

## Deployment
- GitHub: https://github.com/collymonsterr/talentscout
- Vercel: https://expert-scout.vercel.app
- Auto-deploys on push to main branch
- Env vars configured in Vercel dashboard

## Documentation
See README.md, ARCHITECTURE.md, PRODUCT.md, DATABASE.md, API.md, DECISIONS.md, ROADMAP.md, TODO.md
