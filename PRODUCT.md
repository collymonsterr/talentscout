# ExpertScout — Product Spec

## Vision
Help users find hidden experts on Reddit based on demonstrated expertise in public posts and comments.

## Core flow
1. User describes the expert they need in natural language
2. App generates structured search criteria using AI
3. App searches Reddit for high-signal discussions
4. App extracts contributors and groups evidence by username
5. App scores candidates on multiple dimensions
6. User reviews ranked shortlist with evidence
7. User saves promising candidates to a bench

## Pages

### Homepage (`/`)
- Product headline and description
- Large textarea for expert brief
- Example prompt prefill button
- "Find Experts" CTA
- "How it works" section

### Search Results (`/search/[id]`)
- Original user brief
- Generated criteria (skills, tools, subreddits, phrases)
- Status progression indicator
- Ranked candidate cards with scores and summaries

### Candidate Detail (`/candidates/[id]`)
- Full score breakdown (6 dimensions)
- Expertise summary and strengths
- Evidence items linked to Reddit
- Outreach angle and draft message
- Save to bench button

### Bench (`/bench`)
- Saved candidates with status tracking
- Tags and notes
- Status: not_contacted, contacted, replied, interested, not_relevant

## Language guidelines
Use: "Likely expertise", "Evidence suggests", "Strong match based on public activity", "Needs manual review"
Avoid: "Verified expert", "Guaranteed", "This person is available"

## Scoring dimensions
1. Relevance (25%) — discusses requested topics/tools
2. Practicality (30%) — has actually built/implemented things
3. Specificity (20%) — mentions real tools, APIs, errors, tradeoffs
4. Helpfulness (10%) — answers questions, advises others
5. Consistency (15%) — repeated evidence across threads
6. Recency — displayed separately
