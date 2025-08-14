import { NextResponse } from 'next/server';
import { supabase as dbSupabase } from '@/lib/db/supabase-db';
import { supabase } from '@/lib/supabase';
import { sendDeletionWarningEmail } from '@/lib/email/sendDeletionWarning';

export async function DELETE(_req, context) {
  const { params } = await context;
  const { id } = await params;
  try {
    const { data: archivedModel, error } = await dbSupabase
      .from('archived_models')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !archivedModel) {
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
      await dbSupabase
        .from('archived_models')
        .delete()
        .eq('id', id);
      return NextResponse.json({ message: 'Archived model and file deleted successfully' }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Notify all purchasers of an archived model (set scheduledDeletionDate and send email with real date if purchasedBy.length > 0)
export async function POST(req, context) {
  const { params } = await context;
  const { id } = await params;
  try {
    const archivedModel = await prisma.archivedModel.findUnique({
      where: { id }
    });
    if (!archivedModel) {
      return NextResponse.json({ error: 'Archived model not found' }, { status: 404 });
    }
    if (Array.isArray(archivedModel.purchasedBy) && archivedModel.purchasedBy.length > 0) {
      // Calculate the real deletion date (1 minute from now for testing)
      const deletionDate = new Date(Date.now() + 1 * 60 * 1000); // 1 minute from now
      await prisma.archivedModel.update({
        where: { id },
        data: { scheduledDeletionDate: deletionDate }
      });
      // Send notification emails with the exact scheduled deletion date
      await Promise.all(
        archivedModel.purchasedBy.map(email =>
          sendDeletionWarningEmail({
            to: email,
            modelName: archivedModel.name,
            deletionDate: archivedModel.scheduledDeletionDate.toLocaleDateString(),
          })
        )
      );
      return NextResponse.json({ message: 'Model has purchasers. Scheduled deletion date set and emails sent.', scheduledDeletionDate: deletionDate.toISOString() });
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
      await prisma.archivedModel.delete({
        where: { id }
      });
      return NextResponse.json({ message: 'File and model metadata deleted successfully.' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

// Scheduled deletion job (for testing, can be run manually or as a cron job)
// This function should be moved to a separate utility file or cron job
async function deleteExpiredModels() {
  const now = new Date();
  const { data: expiredModels, error } = await dbSupabase
    .from('archived_models')
    .select('*')
    .lte('scheduled_deletion_date', now.toISOString());

  if (error) {
    console.error('Error fetching expired models:', error);
    return;
  }

  for (const model of expiredModels || []) {
    // Delete file from Supabase Storage
    const supabasePath = model.file_storage?.supabasePath;
    if (supabasePath) {
      await supabase.storage.from('models').remove([supabasePath]);
    }

    // Delete the archived model record
    await dbSupabase
      .from('archived_models')
      .delete()
      .eq('id', model.id);
  }
}