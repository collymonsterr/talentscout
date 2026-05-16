import OpenAI from 'openai';
import type { SearchCriteria, RedditItem } from './types';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function generateSearchCriteria(userBrief: string): Promise<Omit<SearchCriteria, 'id' | 'search_id' | 'created_at'>> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert at finding specialists on Reddit. Given a description of the type of expert someone is looking for, generate structured search criteria.

Return JSON with these fields:
- core_skills: array of 3-8 core skill areas
- tools: array of 5-15 specific tools, platforms, or technologies
- subreddits: array of 5-10 relevant subreddit names (without r/ prefix)
- search_phrases: array of 8-10 specific search phrases that would find relevant discussions
- negative_filters: array of 3-5 phrases that indicate spam, self-promotion, or low-quality content
- expertise_signals: array of 4-6 descriptions of what genuine expertise looks like in this domain

Focus on finding people who have actually built things and solve real problems, not people who just talk about topics theoretically.`
      },
      {
        role: 'user',
        content: userBrief
      }
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No response from OpenAI');

  return JSON.parse(content);
}

interface CandidateScore {
  username: string;
  relevance_score: number;
  practicality_score: number;
  specificity_score: number;
  helpfulness_score: number;
  consistency_score: number;
  recency_score: number;
  likely_expertise: string;
  summary: string;
  strengths: string[];
  risks: string[];
  outreach_angle: string;
  outreach_message: string;
  evidence_assessments: {
    reddit_item_id: string;
    relevance_reason: string;
    evidence_strength: 'strong' | 'moderate' | 'weak';
  }[];
}

export async function scoreCandidates(
  userBrief: string,
  candidateGroups: { username: string; items: RedditItem[] }[]
): Promise<CandidateScore[]> {
  const candidateSummaries = candidateGroups.map(({ username, items }) => ({
    username,
    item_count: items.length,
    subreddits: [...new Set(items.map(i => i.subreddit))],
    items: items.slice(0, 10).map(item => ({
      id: item.id,
      subreddit: item.subreddit,
      type: item.item_type,
      title: item.title?.slice(0, 150),
      body: item.body?.slice(0, 500),
      score: item.score,
      created_utc: item.created_utc,
    }))
  }));

  const batchSize = 5;
  const results: CandidateScore[] = [];

  for (let i = 0; i < candidateSummaries.length; i += batchSize) {
    const batch = candidateSummaries.slice(i, i + batchSize);

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are scoring Reddit users as potential experts. The user is looking for: "${userBrief}"

For each candidate, analyse their Reddit posts/comments and score them on these dimensions (0-100):
- relevance_score: Do they discuss the requested topics, tools or problems?
- practicality_score: Do they sound like they've actually built, implemented, or debugged things?
- specificity_score: Do they mention real tools, workflows, APIs, limitations, errors, or tradeoffs?
- helpfulness_score: Are they answering questions, advising others, or solving problems?
- consistency_score: Do they show repeated evidence across multiple items, not just one mention?
- recency_score: How recent is their activity? (100 = last month, 70 = last 6 months, 40 = last year, 20 = older)

Also provide:
- likely_expertise: one-line description of their likely expertise area
- summary: 2-3 sentences on why they might be a match (use careful language like "evidence suggests", "appears to")
- strengths: array of 2-4 specific strengths based on evidence
- risks: array of 1-3 uncertainties or risks (e.g. "limited recent activity", "mostly theoretical discussion")
- outreach_angle: one sentence suggesting how to approach this person
- outreach_message: a respectful, non-spammy draft outreach message (3-4 sentences)
- evidence_assessments: for each item, provide the reddit item id, why it's relevant, and strength (strong/moderate/weak)

Return JSON: { "candidates": [...] }

Be honest and conservative. Do not overclaim expertise. If evidence is thin, say so.`
        },
        {
          role: 'user',
          content: JSON.stringify(batch)
        }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) continue;

    const parsed = JSON.parse(content);
    if (parsed.candidates) {
      results.push(...parsed.candidates);
    }
  }

  return results;
}
