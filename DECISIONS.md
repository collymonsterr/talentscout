# ExpertScout — Decision Log

## 001: No authentication for MVP
**Date:** 2026-05-15
**Decision:** Skip auth entirely for MVP.
**Reason:** Single-user tool proving the intelligence funnel works. Auth adds complexity without value at this stage.

## 002: Reddit public JSON over OAuth
**Date:** 2026-05-15
**Decision:** Use Reddit's public `.json` endpoints instead of the authenticated API.
**Reason:** No credentials needed, simpler setup, sufficient for MVP search volume. Documented in API.md. Can upgrade to OAuth later if rate limits become an issue.

## 003: Sequential API calls from frontend
**Date:** 2026-05-15
**Decision:** The search results page triggers create → reddit → score as sequential API calls, polling for status.
**Reason:** Simpler than background jobs or webhooks. The user sees progress through status updates. May hit Vercel function timeout limits for large searches — acceptable for MVP.

## 004: No ORM — Supabase client directly
**Date:** 2026-05-15
**Decision:** Use `@supabase/supabase-js` directly instead of Prisma or Drizzle.
**Reason:** Fewer dependencies, supabase-js is well-typed, schema is simple enough.

## 005: shadcn/ui for components
**Date:** 2026-05-15
**Decision:** Use shadcn/ui with light theme, zinc base color.
**Reason:** Clean B2B aesthetic, full source ownership, consistent with Linear/Notion style.

## 006: OpenAI for all AI tasks
**Date:** 2026-05-15
**Decision:** Use OpenAI (gpt-4o-mini for criteria, gpt-4o for scoring) for both criteria generation and candidate analysis.
**Reason:** Single provider simplifies setup. gpt-4o-mini is fast and cheap for structured extraction. gpt-4o provides better analysis for scoring.
