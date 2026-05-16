import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get recent completed searches with candidate counts
    const { data: searches, error } = await supabaseAdmin
      .from('searches')
      .select('id, user_brief, status, created_at')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch searches:', error);
      return NextResponse.json({ error: 'Failed to fetch searches' }, { status: 500 });
    }

    // Get candidate counts for each search
    const searchesWithCounts = await Promise.all(
      (searches || []).map(async (search) => {
        const { count } = await supabaseAdmin
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('search_id', search.id);

        return {
          ...search,
          candidate_count: count || 0,
        };
      })
    );

    // Only return searches that actually have candidates
    const withCandidates = searchesWithCounts.filter(s => s.candidate_count > 0);

    return NextResponse.json({ searches: withCandidates });
  } catch (error) {
    console.error('List searches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
