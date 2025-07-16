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

    // Check purchasedBy array
    if (archivedModel.purchasedBy && archivedModel.purchasedBy.length > 0) {
      return NextResponse.json({ message: 'Model has purchasers, not deleting.' }, { status: 200 });
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

// POST: Notify all purchasers of an archived model (no deletion)
export async function POST(req, context) {
  const { params } = await context;
  const { id } = await params;
  console.log('POST /api/models/archived/[id] called with id:', id);
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY);
  try {
    await connect();
    const archivedModel = await ArchivedModel.findById(id);
    if (!archivedModel) {
      console.log('Archived model not found');
      return NextResponse.json({ error: 'Archived model not found' }, { status: 404 });
    }
    if (!Array.isArray(archivedModel.purchasedBy) || archivedModel.purchasedBy.length === 0) {
      console.log('No purchasers to notify.');
      return NextResponse.json({ message: 'No purchasers to notify.' });
    }
    const deletionDate = new Date().toLocaleDateString(); // Or set a future date if needed
    console.log('Sending emails to:', archivedModel.purchasedBy);
    await Promise.all(
      archivedModel.purchasedBy.map(email => {
        console.log('Calling sendDeletionWarningEmail for:', email);
        return sendDeletionWarningEmail({
          to: email,
          modelName: archivedModel.name,
          deletionDate,
        });
      })
    );
    console.log('All emails sent');
    return NextResponse.json({ message: 'Notification emails sent to all purchasers.' });
  } catch (error) {
    console.error('Error sending notification emails:', error);
    return NextResponse.json({ error: 'Failed to send notification emails.' }, { status: 500 });
  }
} 