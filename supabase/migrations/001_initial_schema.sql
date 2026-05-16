-- ExpertScout initial schema

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Searches
create table searches (
  id uuid primary key default uuid_generate_v4(),
  user_brief text not null,
  status text not null default 'generating_criteria',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_searches_status on searches(status);
create index idx_searches_created_at on searches(created_at desc);

-- Search criteria
create table search_criteria (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references searches(id) on delete cascade,
  core_skills jsonb not null default '[]',
  tools jsonb not null default '[]',
  subreddits jsonb not null default '[]',
  search_phrases jsonb not null default '[]',
  negative_filters jsonb not null default '[]',
  expertise_signals jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index idx_search_criteria_search_id on search_criteria(search_id);

-- Reddit items
create table reddit_items (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references searches(id) on delete cascade,
  reddit_id text not null,
  username text not null,
  subreddit text not null,
  item_type text not null,
  title text,
  body text,
  permalink text,
  score integer default 0,
  num_comments integer default 0,
  created_utc timestamptz,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create index idx_reddit_items_search_id on reddit_items(search_id);
create index idx_reddit_items_username on reddit_items(username);
create index idx_reddit_items_subreddit on reddit_items(subreddit);
create unique index idx_reddit_items_unique on reddit_items(search_id, reddit_id);

-- Candidates
create table candidates (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references searches(id) on delete cascade,
  username text not null,
  overall_score real not null default 0,
  relevance_score real not null default 0,
  practicality_score real not null default 0,
  specificity_score real not null default 0,
  helpfulness_score real not null default 0,
  consistency_score real not null default 0,
  recency_score real not null default 0,
  likely_expertise text,
  summary text,
  strengths jsonb default '[]',
  risks jsonb default '[]',
  outreach_angle text,
  outreach_message text,
  evidence_count integer not null default 0,
  relevant_subreddits jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_candidates_search_id on candidates(search_id);
create index idx_candidates_score on candidates(search_id, overall_score desc);

-- Candidate evidence
create table candidate_evidence (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  reddit_item_id uuid not null references reddit_items(id) on delete cascade,
  relevance_reason text,
  evidence_strength text not null default 'moderate',
  created_at timestamptz not null default now()
);

create index idx_candidate_evidence_candidate_id on candidate_evidence(candidate_id);
create index idx_candidate_evidence_reddit_item_id on candidate_evidence(reddit_item_id);

-- Saved candidates (bench)
create table saved_candidates (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  username text not null,
  status text not null default 'not_contacted',
  tags jsonb default '[]',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_saved_candidates_candidate_id on saved_candidates(candidate_id);
create index idx_saved_candidates_status on saved_candidates(status);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_searches_updated_at before update on searches
  for each row execute function update_updated_at();

create trigger tr_candidates_updated_at before update on candidates
  for each row execute function update_updated_at();

create trigger tr_saved_candidates_updated_at before update on saved_candidates
  for each row execute function update_updated_at();
