import { NextResponse } from 'next/server';
import ArchivedModel from '@/lib/db/ArchivedModel';
import connect from '@/lib/db/connect';
import { supabase } from '@/lib/supabase';

export async function DELETE(req, { params }) {
  try {
    await connect();
    const { id } = params;
    const archivedModel = await ArchivedModel.findById(id);
    if (!archivedModel) {
      return NextResponse.json({ error: 'Archived model not found' }, { status: 404 });
    }

    // Delete file from Supabase Storage
    const supabasePath = archivedModel.fileStorage?.supabasePath;
    if (supabasePath) {
      const { error: storageError } = await supabase
        .storage
        .from('models')
        .remove([supabasePath]);
      if (storageError) {
        return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 });
      }
    }

    // Delete the archived model document
    await ArchivedModel.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Archived model and file deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 