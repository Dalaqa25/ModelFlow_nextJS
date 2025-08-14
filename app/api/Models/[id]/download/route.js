import { supabase } from '@/lib/supabase';
import { modelDB, supabase as dbSupabase } from '@/lib/db/supabase-db';
import { NextResponse } from 'next/server';

export async function GET(_request, context) {
  try {
    const { id } = await context.params;

    // 1. Get model from DB (try Model first, then ArchivedModel)
    let model;
    let filePath;

    try {
      model = await modelDB.getModelById(id);
      // Get file storage for regular model
      const { data: fileStorage } = await dbSupabase
        .from('model_file_storage')
        .select('supabase_path')
        .eq('model_id', id)
        .maybeSingle();
      filePath = fileStorage?.supabase_path;
    } catch (error) {
      // Try archived models
      const { data: archivedModel } = await dbSupabase
        .from('archived_models')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (archivedModel) {
        model = archivedModel;
        // Get file storage for archived model
        const { data: fileStorage } = await dbSupabase
          .from('archived_model_file_storage')
          .select('supabase_path')
          .eq('archived_model_id', id)
          .maybeSingle();
        filePath = fileStorage?.supabase_path;
      }
    }

    if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    if (!filePath) return NextResponse.json({ error: 'No file path found for model' }, { status: 400 });

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