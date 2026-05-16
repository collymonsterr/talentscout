import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select()
      .eq('id', id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const { data: evidence } = await supabaseAdmin
      .from('candidate_evidence')
      .select(`
        *,
        reddit_item:reddit_items(*)
      `)
      .eq('candidate_id', id)
      .order('evidence_strength', { ascending: true });

    // Check if saved
    const { data: saved } = await supabaseAdmin
      .from('saved_candidates')
      .select()
      .eq('candidate_id', id)
      .single();

    return NextResponse.json({
      candidate,
      evidence: evidence || [],
      saved: saved || null,
    });
  } catch (error) {
    console.error('Get candidate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
