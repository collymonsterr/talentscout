# ExpertScout — API Routes

All routes are Next.js App Router API routes. Long-running routes set `maxDuration = 120` for Vercel.

## GET /api/searches
List recent completed searches with candidate counts. Used by the homepage.

**Output:** `{ searches: [{ id, user_brief, status, created_at, candidate_count }] }`
**Notes:** Returns only completed searches with at least 1 candidate. Limited to 10 most recent.

## POST /api/search/create
Create a new expert search and generate AI criteria.

**Input:** `{ userBrief: string }` (min 10 chars)
**Output:** `{ searchId: string, criteria: SearchCriteria }`
**Flow:** Creates search row (status: generating_criteria) → OpenAI gpt-4o-mini generates structured criteria → saves criteria → updates status to criteria_ready → returns
**Errors:** Returns actual OpenAI/Supabase error messages for debugging.

## POST /api/search/reddit
Execute Reddit search for an existing search. `maxDuration = 120`.

**Input:** `{ searchId: string }`
**Output:** `{ itemCount: number }`
**Flow:** Loads criteria → sets status to searching_reddit → searches Reddit JSON endpoints → stores items in batches of 100 (upsert to avoid duplicates) → returns count
**Limits:** Max 10 subreddits, 10 phrases, 25 items per phrase (~500 max items). 1.5s delay between requests.
**Edge case:** If 0 results found, sets search status to error with message.

## POST /api/candidates/score
Score and rank candidates from collected Reddit items. `maxDuration = 120`.

**Input:** `{ searchId: string }`
**Output:** `{ candidates: Candidate[] }`
**Flow:** Sets status to scoring_candidates → groups items by username → filters (need 2+ items, or 1 item with 10+ upvotes) → takes top 30 groups → sends to OpenAI gpt-4o in batches of 5 → creates candidate + evidence records → sets status to complete
**Scoring:** Weighted composite: practicality 30%, relevance 25%, specificity 20%, consistency 15%, helpfulness 10%. Recency scored separately.
**Evidence linking:** AI returns evidence_assessments mapping items to relevance reasons. Falls back to linking all items if AI doesn't return assessments.

## GET /api/search/[id]
Get search details with criteria and candidates.

**Output:** `{ search: Search, criteria: SearchCriteria | null, candidates: Candidate[] }`
**Notes:** Candidates sorted by overall_score descending.

## GET /api/candidates/[id]
Get candidate details with evidence and saved status.

**Output:** `{ candidate: Candidate, evidence: CandidateEvidence[], saved: SavedCandidate | null }`
**Notes:** Evidence includes joined reddit_item data (subreddit, body, permalink, etc.).

## POST /api/candidates/save
Save a candidate to the bench.

**Input:** `{ candidateId: string, tags?: string[], notes?: string }`
**Output:** `{ saved: SavedCandidate }`

## GET /api/bench
List all saved candidates with their candidate data.

**Output:** `{ saved: SavedCandidate[] }` (each includes nested candidate object)
**Notes:** Sorted by created_at descending.

## PATCH /api/bench/[id]
Update a saved candidate's status, tags, or notes.

**Input:** `{ status?: string, tags?: string[], notes?: string }`
**Output:** `{ saved: SavedCandidate }`

## Reddit API approach
Uses public JSON endpoints (no OAuth required):
- Subreddit search: `https://www.reddit.com/r/{subreddit}/search.json?q={phrase}&sort=relevance&t=year&limit=25`
- Also fetches top comments from matching posts
- Fallback to global search if subreddit search fails
- Rate limited with 1.5s delays between requests
- User-Agent: `ExpertScout/1.0 (MVP research tool)`

**Limitations:**
- Public endpoints have stricter rate limits than authenticated API
- Some subreddits may not return results
- Comment search relies on fetching post comments (not direct comment search)
- Max ~500 items per search to stay within reasonable processing time
