# ExpertScout — API Routes

## POST /api/search/create
Create a new expert search.

**Input:** `{ userBrief: string }`
**Output:** `{ searchId: string, criteria: SearchCriteria }`
**Flow:** Creates search row → generates criteria via OpenAI → saves criteria → returns

## POST /api/search/reddit
Execute Reddit search for an existing search.

**Input:** `{ searchId: string }`
**Output:** `{ itemCount: number }`
**Flow:** Loads criteria → searches Reddit JSON endpoints → stores items → returns count
**Limits:** Max 10 subreddits, 10 phrases, 25 items per phrase (~500 max items)

## POST /api/candidates/score
Score and rank candidates from collected Reddit items.

**Input:** `{ searchId: string }`
**Output:** `{ candidates: Candidate[] }`
**Flow:** Groups items by username → filters weak candidates → scores via OpenAI → creates records

## GET /api/search/[id]
Get search details with criteria and candidates.

**Output:** `{ search: Search, criteria: SearchCriteria, candidates: Candidate[] }`

## GET /api/candidates/[id]
Get candidate details with evidence.

**Output:** `{ candidate: Candidate, evidence: Evidence[] }`

## POST /api/candidates/save
Save a candidate to the bench.

**Input:** `{ candidateId: string, tags?: string[], notes?: string }`
**Output:** `{ saved: SavedCandidate }`

## PATCH /api/bench/[id]
Update a saved candidate.

**Input:** `{ status?: string, tags?: string[], notes?: string }`
**Output:** `{ saved: SavedCandidate }`

## GET /api/bench
List all saved candidates.

**Output:** `{ saved: SavedCandidate[] }`

## Reddit API approach
Uses public JSON endpoints (no OAuth required):
- `https://www.reddit.com/r/{subreddit}/search.json?q={phrase}&sort=relevance&t=year&limit=25`
- Fallback: `https://www.reddit.com/search.json?q={phrase}&limit=25`
- Rate limited with delays between requests
- User-Agent header set to avoid blocks

**Limitations:**
- Public endpoints have stricter rate limits than authenticated API
- Some subreddits may not return results
- Comment search is limited — may need to fetch post comments separately
