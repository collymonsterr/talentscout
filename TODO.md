# ExpertScout — TODO

## In progress
- [ ] Build core library modules (types, supabase, openai, reddit)
- [ ] Build API routes
- [ ] Build frontend pages

## Up next
- [ ] Loading states and skeleton loaders
- [ ] Error handling and display
- [ ] End-to-end testing in browser

## Known limitations
- Reddit public JSON has stricter rate limits than authenticated API
- Long searches may hit Vercel function timeout (60s default)
- Comment search is limited — posts are the primary signal source
- No duplicate candidate detection across searches yet
