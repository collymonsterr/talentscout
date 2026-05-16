# ExpertScout — TODO

## Complete
- [x] Project setup (Next.js 15, TypeScript, Tailwind, shadcn/ui)
- [x] Database schema (6 tables in Supabase)
- [x] Core library modules (types, supabase, openai, reddit clients)
- [x] API routes (9 routes: search create/reddit/get, candidates score/get/save, searches list, bench get/update)
- [x] Homepage with search form and example prompt
- [x] Search results page with visual progress pipeline
- [x] Candidate detail page with score breakdown and evidence
- [x] Bench page for saved candidates
- [x] Auto-progressing search pipeline (criteria → reddit → scoring)
- [x] Recent searches displayed on homepage
- [x] Rich candidate cards (summary, strengths, Reddit links, message button)
- [x] Loading skeletons and error states
- [x] Deployed to Vercel with env vars configured

## Remaining work
- [ ] End-to-end test of full pipeline in production (criteria → reddit → scoring → results)
- [ ] Verify candidate detail page loads correctly with evidence
- [ ] Verify bench save/update flow works
- [ ] Handle edge cases: empty results, very long briefs, Reddit rate limits
- [ ] Better error recovery when Reddit search partially fails

## Known limitations
- Reddit public JSON has stricter rate limits than authenticated API
- Long searches may approach Vercel function timeout (maxDuration set to 120s)
- Comment search is limited — posts are the primary signal source
- No duplicate candidate detection across searches
- No pagination on search results or bench page
- Supabase key naming changed — "Publishable key" = anon key, "Secret key" = service role key
