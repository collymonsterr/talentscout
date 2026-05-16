# ExpertScout — Architecture

## System overview

```
User → Homepage → POST /api/search/create → OpenAI gpt-4o-mini (criteria) → Supabase
                  POST /api/search/reddit → Reddit JSON API → Supabase (batch upsert)
                  POST /api/candidates/score → OpenAI gpt-4o (scoring) → Supabase
       Results ← GET /api/search/[id] ← Supabase (search + criteria + candidates)
       Detail  ← GET /api/candidates/[id] ← Supabase (candidate + evidence + reddit_items)
       Bench   ← GET /api/bench ← Supabase (saved_candidates + candidates)
       Recent  ← GET /api/searches ← Supabase (completed searches + candidate counts)
```

## Intelligence funnel

1. **Brief → Criteria**: OpenAI gpt-4o-mini converts natural language into structured search criteria (skills, tools, subreddits, phrases, negative filters, expertise signals)
2. **Criteria → Reddit Items**: Search Reddit public JSON endpoints with generated phrases across relevant subreddits. Fetches posts and top comments. Max ~500 items with 1.5s delays.
3. **Reddit Items → Candidates**: Group by username, filter weak signals (need 2+ items or 1 high-upvote item), take top 30, score with OpenAI gpt-4o in batches of 5
4. **Candidates → Shortlist**: Rank by weighted score, display with evidence, summaries, strengths, and direct Reddit links

## Frontend pipeline

The search results page (`/search/[id]`) auto-runs the full pipeline:
1. Page loads → fetches current search state
2. If criteria_ready + no candidates → triggers Reddit search API call
3. After Reddit search returns → triggers scoring API call
4. Polls every 3s during processing to update the visual progress
5. Shows candidates when status reaches "complete"

This is done with a `runPipeline()` function using a ref to prevent duplicate triggers.

## Key implementation details

### Lazy initialization (build-time safety)
Both Supabase and OpenAI clients use lazy initialization to avoid `env var missing` errors during Next.js build:
- `src/lib/supabase.ts` — Uses a Proxy that calls `getSupabaseAdmin()` on first access
- `src/lib/openai.ts` — Uses `getOpenAI()` getter instead of module-level `new OpenAI()`

### API route timeouts
Reddit search and candidate scoring routes set `maxDuration = 120` (2 minutes) for Vercel's function timeout. Default is 60s which is too short for large searches.

### Reddit item storage
Items are inserted in batches of 100 using upsert with `onConflict: 'search_id,reddit_id'` to avoid duplicates on retry.

## Tech decisions

| Choice | Reason |
|--------|--------|
| Next.js 15 App Router | Server components, API routes, Vercel-native |
| Supabase | Managed Postgres, typed client, free tier sufficient |
| OpenAI API | gpt-4o-mini for fast criteria, gpt-4o for quality scoring |
| Reddit public JSON | No OAuth needed, sufficient for MVP volume |
| shadcn/ui | Clean B2B components, full source ownership |
| No auth | MVP is single-user, proving the funnel works |
| No background jobs | API routes handle processing, frontend orchestrates |
| Lazy client init | Avoids build-time crashes when env vars not available |

## Deployment

- **GitHub**: https://github.com/collymonsterr/talentscout
- **Vercel**: https://expert-scout.vercel.app
- Auto-deploys on push to `main` branch
- Environment variables configured in Vercel dashboard
- Vercel project ID: `prj_VU8uaGDqmqZEoLeWHlhX6OJi10n4`
