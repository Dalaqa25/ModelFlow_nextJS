import { supabase } from '@/lib/supabase';
import Model from '@/lib/db/Model';
import { NextResponse } from 'next/server';

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    console.log('Download request for model ID:', id);
    // 1. Get model from DB
    const model = await Model.findById(id);
    console.log('Model found:', model);
    if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 });

    // 2. Get file path from model
    const filePath = model.fileStorage?.supabasePath;
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