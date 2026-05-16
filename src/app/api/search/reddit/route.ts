import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { executeSearch } from '@/lib/reddit';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const { searchId } = await request.json();

    if (!searchId) {
      return NextResponse.json({ error: 'searchId is required' }, { status: 400 });
    }

    const { data: criteria, error: criteriaError } = await supabaseAdmin
      .from('search_criteria')
      .select()
      .eq('search_id', searchId)
      .single();

    if (criteriaError || !criteria) {
      return NextResponse.json({ error: 'Search criteria not found' }, { status: 404 });
    }

    await supabaseAdmin
      .from('searches')
      .update({ status: 'searching_reddit' })
      .eq('id', searchId);

    const results = await executeSearch(
      criteria.subreddits,
      criteria.search_phrases,
    );

    if (results.length === 0) {
      await supabaseAdmin
        .from('searches')
        .update({ status: 'error', error_message: 'No Reddit results found. Try a broader search.' })
        .eq('id', searchId);
      return NextResponse.json({ itemCount: 0, message: 'No results found' });
    }

    const items = results.map(r => ({
      search_id: searchId,
      reddit_id: r.reddit_id,
      username: r.username,
      subreddit: r.subreddit,
      item_type: r.item_type,
      title: r.title,
      body: r.body,
      permalink: r.permalink,
      score: r.score,
      num_comments: r.num_comments,
      created_utc: r.created_utc ? new Date(r.created_utc * 1000).toISOString() : null,
      raw_json: r.raw_json,
    }));

    // Insert in batches to avoid payload limits
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const { error: insertError } = await supabaseAdmin
        .from('reddit_items')
        .upsert(batch, { onConflict: 'search_id,reddit_id' });

      if (insertError) {
        console.error('Failed to insert reddit items batch:', insertError);
      }
    }

    await supabaseAdmin
      .from('searches')
      .update({ status: 'criteria_ready' })
      .eq('id', searchId);

    return NextResponse.json({ itemCount: results.length });
  } catch (error) {
    console.error('Reddit search error:', error);
    return NextResponse.json({ error: 'Reddit search failed' }, { status: 500 });
  }
}
