# ExpertScout — Roadmap

## MVP (complete)
- [x] Project setup (Next.js 15, Supabase, OpenAI, Tailwind, shadcn/ui)
- [x] Database schema (6 tables with indexes)
- [x] Core search funnel (brief → criteria → reddit → candidates)
- [x] Homepage with search form, examples, and recent searches
- [x] Results page with auto-progressing pipeline and ranked candidates
- [x] Candidate detail with score breakdown, evidence, and outreach
- [x] Bench for saving and managing candidates
- [x] Deployed to Vercel with auto-deploy from GitHub

## Next priorities
- [ ] End-to-end production testing and bug fixes
- [ ] Better Reddit search coverage (comments, more subreddits)
- [ ] Handle Reddit rate limits gracefully with retry logic
- [ ] Streaming status updates (SSE) instead of polling every 3s
- [ ] Export candidates to CSV
- [ ] Duplicate detection across searches

## Caching & intelligence layer
- Topic clusters: group related searches, share cached Reddit data
- Cached subreddit maps: known subreddits per topic area
- Cached high-signal threads: reuse valuable discussions across searches
- Known expert database: build up expert profiles over multiple searches
- Candidate refresh cycle: periodically re-check known experts for new activity

## Feature ideas
- User authentication and personal workspaces
- Team collaboration on candidate benches
- Email/DM outreach integration
- Multi-platform search (Twitter/X, HackerNews, GitHub, Stack Overflow)
- Candidate comparison view
- Saved search templates
- Webhook notifications for new matches
- API access for programmatic use
- Search quality feedback loop (mark results as good/bad to improve)

## Technical improvements
- Background job processing (Vercel Cron or queue) for long searches
- Rate limit management with exponential backoff
- Redis caching layer for frequently-accessed data
- Full-text search on stored Reddit content
- Analytics dashboard (searches per day, conversion to saved candidates)
- Pagination on all list views
