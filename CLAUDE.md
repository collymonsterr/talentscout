# ExpertScout

## What this is
ExpertScout is an MVP web app that finds hidden experts on Reddit based on demonstrated expertise in public posts and comments. Users describe the expert they need, the app searches Reddit intelligently, scores candidates, and returns a ranked shortlist.

## Tech stack
- Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Postgres) for database
- OpenAI API for criteria generation and candidate scoring
- Reddit public JSON endpoints (no OAuth needed)

## Project structure
- `src/app/` — pages and API routes (App Router)
- `src/lib/` — shared utilities (supabase, openai, reddit clients, types)
- `src/components/` — React components (shadcn/ui in `ui/`)
- `supabase/migrations/` — SQL schema

## Key commands
- `npm run dev` — start dev server
- `npm run build` — production build

## Architecture decisions
- No auth for MVP — single user
- Reddit public JSON over OAuth — simpler, no credentials needed
- Sequential API flow: create search → search reddit → score candidates
- Supabase direct via supabase-js (no ORM)
- All processing in API routes (no background jobs)

## Documentation
See README.md, ARCHITECTURE.md, PRODUCT.md, DATABASE.md, API.md, DECISIONS.md, ROADMAP.md, TODO.md
