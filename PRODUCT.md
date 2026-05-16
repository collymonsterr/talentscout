# ExpertScout — Product Spec

## Vision
Help users find hidden experts on Reddit based on demonstrated expertise in public posts and comments. Not just people who talk about topics — people who have actually built things, solved problems, and helped others.

## Core flow
1. User describes the expert they need in natural language
2. App generates structured search criteria using AI (skills, tools, subreddits, phrases)
3. App searches Reddit for high-signal discussions matching criteria
4. App extracts contributors and groups evidence by username
5. App scores candidates on 6 dimensions using AI
6. User reviews ranked shortlist with evidence, summaries, and strengths
7. User can message candidates directly on Reddit or save to bench

## Pages

### Homepage (`/`)
- Product headline and description
- Large textarea for expert brief
- Example prompt prefill button
- "Find Experts" CTA → creates search → redirects to results
- **Recent searches** section showing past completed searches with candidate counts
- "How it works" section explaining the 4 steps

### Search Results (`/search/[id]`)
- Original user brief displayed at top
- **Visual progress pipeline** showing 4 steps with checkmarks, active pulse, and time estimates:
  - Generating search criteria (~10s)
  - Searching Reddit (~1-2 min)
  - Analysing and scoring candidates (~30s)
  - Complete
- Pipeline auto-progresses — no user action needed after submitting
- Generated criteria displayed (skills, tools, subreddits, phrases)
- **Rich candidate cards** showing:
  - Username with link to Reddit profile
  - Likely expertise area
  - AI-generated summary of why they match
  - Top 3 strengths as green badges
  - Outreach angle suggestion
  - Subreddits they're active in + evidence count
  - "View full profile" and "Message on Reddit" buttons

### Candidate Detail (`/candidates/[id]`)
- Full score breakdown with visual bars (6 dimensions + recency)
- Expertise summary
- Strengths list (green +) and uncertainties/risks list (amber ?)
- Evidence items linked to original Reddit posts/comments
- Each evidence item shows: subreddit, strength rating, upvotes, body preview, link to Reddit
- Suggested outreach angle + draft outreach message
- Save to bench button

### Bench (`/bench`)
- List of saved candidates with status tracking
- Status dropdown: not_contacted, contacted, replied, interested, not_relevant
- Tags (editable)
- Inline notes editing
- Link back to full candidate detail

## Scoring dimensions
1. **Practicality** (30%) — has actually built/implemented things, not just theoretical
2. **Relevance** (25%) — discusses requested topics, tools, and domains
3. **Specificity** (20%) — mentions real tools, APIs, error messages, tradeoffs
4. **Consistency** (15%) — repeated evidence across multiple threads
5. **Helpfulness** (10%) — answers questions, advises others, shares knowledge
6. **Recency** — displayed separately, not part of weighted score

## Language guidelines
- Use: "Likely expertise", "Evidence suggests", "Strong match based on public activity"
- Avoid: "Verified expert", "Guaranteed", "This person is available"
- All assessments are probabilistic — based on public Reddit activity only
