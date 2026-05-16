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

    console.log(`[Search] Starting Reddit search for ${searchId}`);
    console.log(`[Search] Subreddits: ${criteria.subreddits?.join(', ')}`);
    console.log(`[Search] Phrases: ${criteria.search_phrases?.join(', ')}`);

    await supabaseAdmin
      .from('searches')
      .update({ status: 'searching_reddit' })
      .eq('id', searchId);

    const startTime = Date.now();
    const results = await executeSearch(
      criteria.subreddits || [],
      criteria.search_phrases || [],
    );
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    console.log(`[Search] Reddit search complete: ${results.length} items in ${elapsed}s`);

    if (results.length === 0) {
      console.log('[Search] No results found — setting error status');
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
    let insertedCount = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const { error: insertError } = await supabaseAdmin
        .from('reddit_items')
        .upsert(batch, { onConflict: 'search_id,reddit_id' });

      if (insertError) {
        console.error(`[Search] Failed to insert batch ${i}:`, insertError);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`[Search] Inserted ${insertedCount} items into database`);

    return NextResponse.json({ itemCount: results.length });
  } catch (error) {
    console.error('[Search] Reddit search error:', error);
    return NextResponse.json({ error: 'Reddit search failed' }, { status: 500 });
  }
}
