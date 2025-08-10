import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    // 1. Get model from DB (try Model first, then ArchivedModel)
    let model = await prisma.model.findUnique({
      where: { id }
    });
    
    if (!model) {
      model = await prisma.archivedModel.findUnique({
        where: { id }
      });
    }
    
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