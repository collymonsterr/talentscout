import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { scoreCandidates } from '@/lib/openai';
import type { RedditItem } from '@/lib/types';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const { searchId } = await request.json();

    if (!searchId) {
      return NextResponse.json({ error: 'searchId is required' }, { status: 400 });
    }

    const { data: search } = await supabaseAdmin
      .from('searches')
      .select()
      .eq('id', searchId)
      .single();

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 });
    }

    await supabaseAdmin
      .from('searches')
      .update({ status: 'scoring_candidates' })
      .eq('id', searchId);

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('reddit_items')
      .select()
      .eq('search_id', searchId);

    if (itemsError || !items || items.length === 0) {
      await supabaseAdmin
        .from('searches')
        .update({ status: 'error', error_message: 'No Reddit items to score' })
        .eq('id', searchId);
      return NextResponse.json({ error: 'No items to score' }, { status: 400 });
    }

    // Group by username
    const userGroups = new Map<string, RedditItem[]>();
    for (const item of items as RedditItem[]) {
      const existing = userGroups.get(item.username) || [];
      existing.push(item);
      userGroups.set(item.username, existing);
    }

    // Filter: require at least 2 items or 1 high-score item
    const qualifiedGroups = Array.from(userGroups.entries())
      .filter(([, userItems]) => {
        if (userItems.length >= 2) return true;
        if (userItems.length === 1 && userItems[0].score >= 10) return true;
        return false;
      })
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 30) // Score top 30 candidates max
      .map(([username, userItems]) => ({ username, items: userItems }));

    if (qualifiedGroups.length === 0) {
      await supabaseAdmin
        .from('searches')
        .update({ status: 'error', error_message: 'No qualified candidates found. Try a different search.' })
        .eq('id', searchId);
      return NextResponse.json({ error: 'No qualified candidates' }, { status: 400 });
    }

    const scores = await scoreCandidates(search.user_brief, qualifiedGroups);

    // Create candidate records
    const candidateRecords = [];
    for (const score of scores) {
      const group = qualifiedGroups.find(g => g.username === score.username);
      if (!group) continue;

      const overallScore =
        score.practicality_score * 0.30 +
        score.relevance_score * 0.25 +
        score.specificity_score * 0.20 +
        score.consistency_score * 0.15 +
        score.helpfulness_score * 0.10;

      const { data: candidate, error: candidateError } = await supabaseAdmin
        .from('candidates')
        .insert({
          search_id: searchId,
          username: score.username,
          overall_score: Math.round(overallScore * 10) / 10,
          relevance_score: score.relevance_score,
          practicality_score: score.practicality_score,
          specificity_score: score.specificity_score,
          helpfulness_score: score.helpfulness_score,
          consistency_score: score.consistency_score,
          recency_score: score.recency_score,
          likely_expertise: score.likely_expertise,
          summary: score.summary,
          strengths: score.strengths,
          risks: score.risks,
          outreach_angle: score.outreach_angle,
          outreach_message: score.outreach_message,
          evidence_count: group.items.length,
          relevant_subreddits: [...new Set(group.items.map(i => i.subreddit))],
        })
        .select()
        .single();

      if (candidateError || !candidate) {
        console.error('Failed to create candidate:', candidateError);
        continue;
      }

      // Create evidence links
      if (score.evidence_assessments) {
        const evidenceRecords = score.evidence_assessments
          .filter(e => group.items.some(i => i.id === e.reddit_item_id))
          .map(e => ({
            candidate_id: candidate.id,
            reddit_item_id: e.reddit_item_id,
            relevance_reason: e.relevance_reason,
            evidence_strength: e.evidence_strength,
          }));

        if (evidenceRecords.length > 0) {
          await supabaseAdmin.from('candidate_evidence').insert(evidenceRecords);
        }
      }

      // If no evidence_assessments from AI, link all items as evidence
      if (!score.evidence_assessments || score.evidence_assessments.length === 0) {
        const fallbackEvidence = group.items.map(item => ({
          candidate_id: candidate.id,
          reddit_item_id: item.id,
          relevance_reason: 'Matched search criteria',
          evidence_strength: 'moderate' as const,
        }));
        await supabaseAdmin.from('candidate_evidence').insert(fallbackEvidence);
      }

      candidateRecords.push(candidate);
    }

    await supabaseAdmin
      .from('searches')
      .update({ status: 'complete' })
      .eq('id', searchId);

    // Return sorted by score
    candidateRecords.sort((a, b) => b.overall_score - a.overall_score);

    return NextResponse.json({ candidates: candidateRecords });
  } catch (error) {
    console.error('Scoring error:', error);
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
  }
}
