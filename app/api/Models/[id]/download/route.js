import { supabase } from '@/lib/supabase';
import { modelDB, supabase as dbSupabase } from '@/lib/db/supabase-db';
import { NextResponse } from 'next/server';

export async function GET(_request, context) {
  try {
    const { id } = await context.params;

    // 1. Get model from DB
    const model = await modelDB.getModelById(id);
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // 2. Get file path from storage table
    // Note: The new schema might store this differently. Assuming `file_storage` on the model for now.
    const filePath = model.file_storage?.supabasePath;
    if (!filePath) {
      return NextResponse.json({ error: 'No file path found for this model' }, { status: 400 });
    }

    // 3. Generate signed URL
    const { data, error } = await supabase.storage
      .from('models')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

    if (error) return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });

    // 4. Return signed URL
    return NextResponse.json({ downloadUrl: data.signedUrl });
  } catch (err) {
    console.error('Download API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}