import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const allowedFields = ['status', 'tags', 'notes'];
    const cleanUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: saved, error } = await supabaseAdmin
      .from('saved_candidates')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !saved) {
      return NextResponse.json({ error: 'Saved candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ saved });
  } catch (error) {
    console.error('Update bench error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
