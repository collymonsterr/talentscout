# ExpertScout — Database Schema

## Tables

### searches
Primary table tracking each expert search.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_brief | text | Original user description |
| status | text | generating_criteria, criteria_ready, searching_reddit, scoring_candidates, complete, error |
| error_message | text | Error details if status is error |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### search_criteria
AI-generated structured search criteria.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| search_id | uuid FK → searches | |
| core_skills | jsonb | e.g. ["AI automation", "CRM integration"] |
| tools | jsonb | e.g. ["n8n", "OpenAI", "Zapier"] |
| subreddits | jsonb | e.g. ["n8n", "automation"] |
| search_phrases | jsonb | e.g. ["n8n CRM automation"] |
| negative_filters | jsonb | e.g. ["course seller", "affiliate spam"] |
| expertise_signals | jsonb | e.g. ["gives practical advice"] |
| created_at | timestamptz | |

### reddit_items
Raw Reddit posts and comments collected during search.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| search_id | uuid FK → searches | |
| reddit_id | text | Reddit's thing ID (t1_, t3_) |
| username | text | Reddit username |
| subreddit | text | |
| item_type | text | post or comment |
| title | text | Post title or parent post title |
| body | text | Content text |
| permalink | text | Reddit permalink |
| score | integer | Upvotes |
| num_comments | integer | Comment count (posts only) |
| created_utc | timestamptz | When posted on Reddit |
| raw_json | jsonb | Full Reddit API response |
| created_at | timestamptz | |

### candidates
Scored expert candidates grouped by username.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| search_id | uuid FK → searches | |
| username | text | Reddit username |
| overall_score | real | Weighted composite 0-100 |
| relevance_score | real | 0-100 |
| practicality_score | real | 0-100 |
| specificity_score | real | 0-100 |
| helpfulness_score | real | 0-100 |
| consistency_score | real | 0-100 |
| recency_score | real | 0-100 |
| likely_expertise | text | AI-generated expertise summary |
| summary | text | Why this person matches |
| strengths | jsonb | Array of strength strings |
| risks | jsonb | Array of risk/uncertainty strings |
| outreach_angle | text | Suggested approach |
| outreach_message | text | Draft outreach message |
| evidence_count | integer | Number of evidence items |
| relevant_subreddits | jsonb | Array of subreddit names |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### candidate_evidence
Links candidates to their supporting Reddit items.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| candidate_id | uuid FK → candidates | |
| reddit_item_id | uuid FK → reddit_items | |
| relevance_reason | text | Why this item is relevant |
| evidence_strength | text | strong, moderate, weak |
| created_at | timestamptz | |

### saved_candidates
User's bench of saved candidates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| candidate_id | uuid FK → candidates | |
| username | text | Denormalized for convenience |
| status | text | not_contacted, contacted, replied, interested, not_relevant |
| tags | jsonb | Array of tag strings |
| notes | text | User notes |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## Indexes
- searches: status, created_at
- search_criteria: search_id
- reddit_items: search_id, username, subreddit
- candidates: search_id, overall_score DESC
- candidate_evidence: candidate_id, reddit_item_id
- saved_candidates: candidate_id (unique), status
