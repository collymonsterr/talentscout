import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: search, error: searchError } = await supabaseAdmin
      .from('searches')
      .select()
      .eq('id', id)
      .single();

    if (searchError || !search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 });
    }

    const { data: criteria } = await supabaseAdmin
      .from('search_criteria')
      .select()
      .eq('search_id', id)
      .single();

    const { data: candidates } = await supabaseAdmin
      .from('candidates')
      .select()
      .eq('search_id', id)
      .order('overall_score', { ascending: false });

    return NextResponse.json({
      search,
      criteria: criteria || null,
      candidates: candidates || [],
    });
  } catch (error) {
    console.error('Get search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
