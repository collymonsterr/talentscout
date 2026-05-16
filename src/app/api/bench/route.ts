import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: saved, error } = await supabaseAdmin
      .from('saved_candidates')
      .select(`
        *,
        candidate:candidates(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch bench error:', error);
      return NextResponse.json({ error: 'Failed to fetch bench' }, { status: 500 });
    }

    return NextResponse.json({ saved: saved || [] });
  } catch (error) {
    console.error('Bench error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
