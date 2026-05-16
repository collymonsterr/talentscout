# ExpertScout — Roadmap

## MVP (current)
- [x] Project setup
- [ ] Core search funnel (brief → criteria → reddit → candidates)
- [ ] Results page with ranked candidates
- [ ] Candidate detail with evidence
- [ ] Bench for saving candidates

## Post-MVP improvements
- [ ] Better Reddit search (comments via Pushshift or authenticated API)
- [ ] Streaming status updates (SSE) instead of polling
- [ ] Search history page
- [ ] Export candidates to CSV
- [ ] Duplicate detection across searches

## Future: Caching & intelligence layer
- Topic clusters: group related searches, share cached data
- Cached subreddit maps: known subreddits per topic area
- Cached high-signal threads: reuse valuable discussions
- Known expert database: build up expert profiles across searches
- Candidate refresh cycle: periodically re-check known experts for new activity
- Topic-level intelligence: understand which topics have strong Reddit signal

## Future: Features
- User authentication and personal workspaces
- Team collaboration on candidate benches
- Email outreach integration
- Multi-platform search (Twitter/X, HackerNews, GitHub, Stack Overflow)
- Candidate comparison view
- Saved search templates
- Webhook notifications for new matches
- API access for programmatic use

## Future: Technical
- Background job processing (Vercel Cron or queue)
- Rate limit management and retry logic
- Redis caching layer
- Full-text search on stored content
- Analytics dashboard
