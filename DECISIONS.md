# ExpertScout — Decision Log

## 001: No authentication for MVP
**Date:** 2026-05-15
**Decision:** Skip auth entirely for MVP.
**Reason:** Single-user tool proving the intelligence funnel works. Auth adds complexity without value at this stage. Can add Supabase Auth later.

## 002: Reddit public JSON over OAuth
**Date:** 2026-05-15
**Decision:** Use Reddit's public `.json` endpoints instead of the authenticated API.
**Reason:** No credentials needed, simpler setup, sufficient for MVP search volume. Can upgrade to OAuth later if rate limits become an issue.

## 003: Sequential API calls from frontend
**Date:** 2026-05-15
**Decision:** The search results page triggers create → reddit → score as sequential API calls, auto-progressing through the pipeline.
**Reason:** Simpler than background jobs or webhooks. The user sees progress through a visual pipeline. `maxDuration = 120` handles the longer Reddit search step.

## 004: No ORM — Supabase client directly
**Date:** 2026-05-15
**Decision:** Use `@supabase/supabase-js` directly instead of Prisma or Drizzle.
**Reason:** Fewer dependencies, supabase-js is well-typed, schema is simple enough. Supabase client handles connection pooling.

## 005: shadcn/ui for components
**Date:** 2026-05-15
**Decision:** Use shadcn/ui with light theme, zinc base color.
**Reason:** Clean B2B aesthetic, full source ownership, consistent with Linear/Notion style.

## 006: OpenAI for all AI tasks
**Date:** 2026-05-15
**Decision:** Use OpenAI (gpt-4o-mini for criteria, gpt-4o for scoring) for both criteria generation and candidate analysis.
**Reason:** Single provider simplifies setup. gpt-4o-mini is fast and cheap for structured extraction. gpt-4o provides better analysis for scoring.

## 007: Lazy client initialization
**Date:** 2026-05-15
**Decision:** Use lazy initialization (Proxy pattern for Supabase, getter function for OpenAI) instead of module-level client creation.
**Reason:** Next.js evaluates module-level code at build time. Environment variables aren't available during `npm run build`, causing crashes. Lazy init defers client creation to runtime when env vars are available.

## 008: Frontend-driven pipeline orchestration
**Date:** 2026-05-16
**Decision:** The search results page auto-triggers the full pipeline (reddit search → scoring) using a `runPipeline()` function with ref-based deduplication, rather than relying on status-driven useEffect chains.
**Reason:** Previous approach relied on status transitions in useEffect, which was brittle and caused the page to stall at "Criteria ready" with no user feedback. The pipeline approach is more reliable and shows clear progress.
