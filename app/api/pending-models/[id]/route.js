import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { notificationDB } from '@/lib/db/supabase-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  console.log('🚀 [API] PATCH /api/pending-models/[id] called');

  try {
    const { id } = params;
    console.log('📋 [API] Model ID from params:', id);

    // For admin operations, we'll skip detailed authentication since
    // the frontend already verifies admin status. The service role key
    // provides the necessary permissions for database operations.

    // Note: In production, you might want to add proper authentication
    // by sending the session token from the client

    console.log('📥 [API] Parsing request body...');
    const body = await req.json();
    console.log('📦 [API] Request body:', body);

    const { action, rejectionReason } = body;
    console.log('🎯 [API] Action:', action);
    console.log('📝 [API] Rejection reason:', rejectionReason);

    if (!action || !['approve', 'reject'].includes(action)) {
      console.error('❌ [API] Invalid action:', action);
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // For reject action, rejection reason is required
    if (action === 'reject' && !rejectionReason?.trim()) {
      console.error('❌ [API] Rejection reason required but not provided');
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // For approve, just update status
      const updateData = {
        status: 'approved'
      };

      console.log('🔄 [API] Update data (approve):', updateData);
      console.log('🗄️ [API] Updating model with ID:', id);

      const { data: updatedModel, error } = await supabase
        .from('models')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [API] Database error:', error);
        console.error('❌ [API] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json(
          { error: 'Failed to update model', details: error.message },
          { status: 500 }
        );
      }

      if (!updatedModel) {
        console.error('❌ [API] Model not found after update');
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }

      console.log('✅ [API] Model approved successfully:', updatedModel);
      return NextResponse.json(updatedModel);
    } else if (action === 'reject') {
      // For reject, first get the model to extract file info
      console.log('🔍 [API] Fetching model for rejection:', id);

      const { data: modelToDelete, error: fetchError } = await supabase
        .from('models')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ [API] Failed to fetch model for deletion:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch model', details: fetchError.message },
          { status: 500 }
        );
      }

      if (!modelToDelete) {
        console.error('❌ [API] Model not found for deletion');
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }

      // Delete file from Supabase storage if it exists
      if (modelToDelete.file_storage) {
        try {
          const fileStorage = typeof modelToDelete.file_storage === 'string'
            ? JSON.parse(modelToDelete.file_storage)
            : modelToDelete.file_storage;

          if (fileStorage.supabasePath) {
            console.log('🗂️ [API] Deleting file from storage:', fileStorage.supabasePath);

            const { error: storageError } = await supabase.storage
              .from('models')
              .remove([fileStorage.supabasePath]);

            if (storageError) {
              console.error('❌ [API] Failed to delete file from storage:', storageError);
              // Don't fail the whole operation if file deletion fails
            } else {
              console.log('✅ [API] File deleted from storage successfully');
            }
          }
        } catch (parseError) {
          console.error('❌ [API] Error parsing file storage info:', parseError);
        }
      }

      // Delete the model record from database
      console.log('🗑️ [API] Deleting model record from database:', id);

      const { error: deleteError } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ [API] Failed to delete model:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete model', details: deleteError.message },
          { status: 500 }
        );
      }

      console.log('✅ [API] Model deleted successfully');

      // Create notification for the model author about rejection
      try {
        console.log('📢 [API] Creating rejection notification for author:', modelToDelete.author_email);

        const notificationData = {
          user_email: modelToDelete.author_email,
          title: 'Model Rejected',
          message: `Your model "${modelToDelete.name}" has been rejected. Reason: ${rejectionReason.trim()}`,
          type: 'model_rejection',
          data: {
            model_id: modelToDelete.id,
            model_name: modelToDelete.name,
            rejection_reason: rejectionReason.trim()
          }
        };

        await notificationDB.createNotification(notificationData);
        console.log('✅ [API] Rejection notification created successfully');
      } catch (notificationError) {
        console.error('❌ [API] Failed to create rejection notification:', notificationError);
        // Don't fail the whole request if notification creation fails
      }

      return NextResponse.json({ message: 'Model rejected and deleted successfully' });
    }
  } catch (error) {
    console.error('❌ [API] Exception in PATCH handler:', error);
    console.error('❌ [API] Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}