import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSearchCriteria } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { userBrief } = await request.json();

    if (!userBrief || typeof userBrief !== 'string' || userBrief.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a description of at least 10 characters.' },
        { status: 400 }
      );
    }

    const { data: search, error: searchError } = await supabaseAdmin
      .from('searches')
      .insert({ user_brief: userBrief.trim(), status: 'generating_criteria' })
      .select()
      .single();

    if (searchError || !search) {
      console.error('Failed to create search:', searchError);
      return NextResponse.json({ error: `Failed to create search: ${searchError?.message || 'Unknown error'}` }, { status: 500 });
    }

    try {
      const criteria = await generateSearchCriteria(userBrief);

      const { error: criteriaError } = await supabaseAdmin
        .from('search_criteria')
        .insert({
          search_id: search.id,
          ...criteria,
        });

      if (criteriaError) {
        throw new Error(`Failed to save criteria: ${criteriaError.message}`);
      }

      await supabaseAdmin
        .from('searches')
        .update({ status: 'criteria_ready' })
        .eq('id', search.id);

      const { data: savedCriteria } = await supabaseAdmin
        .from('search_criteria')
        .select()
        .eq('search_id', search.id)
        .single();

      return NextResponse.json({ searchId: search.id, criteria: savedCriteria });
    } catch (aiError) {
      console.error('AI criteria generation failed:', aiError);
      await supabaseAdmin
        .from('searches')
        .update({ status: 'error', error_message: String(aiError) })
        .eq('id', search.id);

      return NextResponse.json(
        { error: 'Failed to generate search criteria', searchId: search.id },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Search creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
