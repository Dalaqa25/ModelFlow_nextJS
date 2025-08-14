// app/api/valid-supabase-paths/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-db';

export async function GET() {
  try {
    // Get all archived models with their file storage
    const { data: models, error } = await supabase
      .from('archived_model_file_storage')
      .select('supabase_path');

    if (error) throw error;

    const validPaths = models
      .map(m => m.supabase_path)
      .filter(Boolean);

    return NextResponse.json(validPaths);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}