# ExpertScout — Architecture

## System overview

```
User → Homepage → POST /api/search/create → OpenAI (criteria) → Supabase
                  POST /api/search/reddit → Reddit JSON API → Supabase
                  POST /api/candidates/score → OpenAI (scoring) → Supabase
       Results ← GET /api/search/[id] ← Supabase
       Detail  ← GET /api/candidates/[id] ← Supabase
       Bench   ← GET /api/bench ← Supabase
```

## Intelligence funnel

1. **Brief → Criteria**: OpenAI converts natural language into structured search criteria (skills, tools, subreddits, phrases, signals)
2. **Criteria → Reddit Items**: Search Reddit public JSON endpoints with generated phrases across relevant subreddits
3. **Reddit Items → Candidates**: Group by username, filter weak signals, score with OpenAI
4. **Candidates → Shortlist**: Rank by weighted score, display with evidence

## Tech decisions

| Choice | Reason |
|--------|--------|
| Next.js App Router | Server components, API routes, Vercel-ready |
| Supabase | Managed Postgres, simple client, free tier |
| OpenAI API | Criteria generation + candidate scoring |
| Reddit public JSON | No OAuth needed, sufficient for MVP volume |
| shadcn/ui | Clean components, full ownership |
| No auth | MVP is single-user |
| No background jobs | API routes handle all processing sequentially |

## Data flow

### Search creation
1. Frontend POSTs user brief to `/api/search/create`
2. API creates search row, calls OpenAI for criteria, saves criteria
3. Returns searchId — frontend redirects to `/search/[id]`

### Reddit search
1. Results page calls `/api/search/reddit` with searchId
2. API loads criteria, searches Reddit (max 10 subreddits × 10 phrases × 25 items)
3. Stores raw reddit_items in Supabase

### Candidate scoring
1. Results page calls `/api/candidates/score` with searchId
2. API groups items by username, filters weak candidates
3. Sends batches to OpenAI for scoring
4. Creates candidate and evidence records

### Caching
- All searches, criteria, items, and candidates are stored
- Future: reuse cached candidates when criteria overlap
- "Last searched" timestamps on all records
