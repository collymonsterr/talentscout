export interface Search {
  id: string;
  user_brief: string;
  status: SearchStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type SearchStatus =
  | 'generating_criteria'
  | 'criteria_ready'
  | 'searching_reddit'
  | 'scoring_candidates'
  | 'complete'
  | 'error';

export interface SearchCriteria {
  id: string;
  search_id: string;
  core_skills: string[];
  tools: string[];
  subreddits: string[];
  search_phrases: string[];
  negative_filters: string[];
  expertise_signals: string[];
  created_at: string;
}

export interface RedditItem {
  id: string;
  search_id: string;
  reddit_id: string;
  username: string;
  subreddit: string;
  item_type: 'post' | 'comment';
  title: string | null;
  body: string | null;
  permalink: string | null;
  score: number;
  num_comments: number;
  created_utc: string | null;
  raw_json: Record<string, unknown> | null;
  created_at: string;
}

export interface Candidate {
  id: string;
  search_id: string;
  username: string;
  overall_score: number;
  relevance_score: number;
  practicality_score: number;
  specificity_score: number;
  helpfulness_score: number;
  consistency_score: number;
  recency_score: number;
  likely_expertise: string | null;
  summary: string | null;
  strengths: string[];
  risks: string[];
  outreach_angle: string | null;
  outreach_message: string | null;
  evidence_count: number;
  relevant_subreddits: string[];
  created_at: string;
  updated_at: string;
}

export interface CandidateEvidence {
  id: string;
  candidate_id: string;
  reddit_item_id: string;
  relevance_reason: string | null;
  evidence_strength: 'strong' | 'moderate' | 'weak';
  created_at: string;
  reddit_item?: RedditItem;
}

export interface SavedCandidate {
  id: string;
  candidate_id: string;
  username: string;
  status: SavedCandidateStatus;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
}

export type SavedCandidateStatus =
  | 'not_contacted'
  | 'contacted'
  | 'replied'
  | 'interested'
  | 'not_relevant';

export interface SearchWithDetails {
  search: Search;
  criteria: SearchCriteria | null;
  candidates: Candidate[];
}

export interface CandidateWithEvidence {
  candidate: Candidate;
  evidence: CandidateEvidence[];
}
