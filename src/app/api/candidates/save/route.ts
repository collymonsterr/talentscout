import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { candidateId, tags, notes } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }

    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('username')
      .eq('id', candidateId)
      .single();

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const { data: saved, error } = await supabaseAdmin
      .from('saved_candidates')
      .upsert({
        candidate_id: candidateId,
        username: candidate.username,
        status: 'not_contacted',
        tags: tags || [],
        notes: notes || null,
      }, { onConflict: 'candidate_id' })
      .select()
      .single();

    if (error) {
      console.error('Save candidate error:', error);
      return NextResponse.json({ error: 'Failed to save candidate' }, { status: 500 });
    }

    return NextResponse.json({ saved });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
