import { NextResponse } from 'next/server';
import ArchivedModel from '@/lib/db/ArchivedModel';
import connect from '@/lib/db/connect';
import { supabase } from '@/lib/supabase';
import { sendDeletionWarningEmail } from '@/lib/email/sendDeletionWarning';

export async function DELETE(req, context) {
  const { params } = await context;
  const { id } = await params;
  try {
    await connect();
    const archivedModel = await ArchivedModel.findById(id);
    if (!archivedModel) {
      return NextResponse.json({ error: 'Archived model not found' }, { status: 404 });
    }

    // If there are purchasers, send notification and log, but do not delete
    if (archivedModel.purchasedBy && archivedModel.purchasedBy.length > 0) {
      // Send notification emails (reuse your POST logic if needed)
      const deletionDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      await Promise.all(
        archivedModel.purchasedBy.map(email =>
          sendDeletionWarningEmail({
            to: email,
            modelName: archivedModel.name,
            deletionDate: deletionDate.toLocaleDateString(),
          })
        )
      );
      return NextResponse.json({ message: 'Notification emails sent. Model will be deleted in 3 days.' });
    } else {
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
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Notify all purchasers of an archived model (delete file and metadata if purchasedBy.length === 0)
export async function POST(req, context) {
  const { params } = await context;
  const { id } = await params;
  try {
    await connect();
    const archivedModel = await ArchivedModel.findById(id);
    if (!archivedModel) {
      return NextResponse.json({ error: 'Archived model not found' }, { status: 404 });
    }
    if (!Array.isArray(archivedModel.purchasedBy) || archivedModel.purchasedBy.length === 0) {
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
      return NextResponse.json({ message: 'File and model metadata deleted successfully.' });
    } else {
      return NextResponse.json({ message: 'Model has purchasers, not deleting file or metadata.' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
} 