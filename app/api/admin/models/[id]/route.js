import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { notificationDB } from '@/lib/db/supabase-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/models/[id]
 * Approve or reject a specific model by ID
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = params;

    // Check if user is authenticated
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin (you can modify this check as needed)
    if (user.email !== 'g.dalaqishvili01@gmail.com') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      console.error('❌ [ADMIN API] Invalid action:', action);
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // For reject action, rejection reason is required
    if (action === 'reject' && !rejectionReason?.trim()) {
      console.error('❌ [ADMIN API] Rejection reason required but not provided');
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // For approve, just update status
      const { data: updatedModel, error } = await supabase
        .from('models')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [ADMIN API] Database error:', error);
        return NextResponse.json(
          { error: 'Failed to update model', details: error.message },
          { status: 500 }
        );
      }

      if (!updatedModel) {
        console.error('❌ [ADMIN API] Model not found after update');
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(updatedModel);
    } else if (action === 'reject') {
      // For reject, first get the model to extract file info
      const { data: modelToDelete, error: fetchError } = await supabase
        .from('models')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ [ADMIN API] Failed to fetch model for deletion:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch model', details: fetchError.message },
          { status: 500 }
        );
      }

      if (!modelToDelete) {
        console.error('❌ [ADMIN API] Model not found for deletion');
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
            console.log(`🗑️ [ADMIN API] Deleting file from storage: ${fileStorage.supabasePath}`);
            
            const { error: storageError } = await supabase.storage
              .from('models')
              .remove([fileStorage.supabasePath]);

            if (storageError) {
              console.error('❌ [ADMIN API] Failed to delete file from storage:', storageError);
              // Don't fail the whole operation if file deletion fails
            } else {
              console.log('✅ [ADMIN API] File deleted from storage successfully');
            }
          }
        } catch (parseError) {
          console.error('❌ [ADMIN API] Error parsing file storage info:', parseError);
        }
      }

      // Delete the model record from database
      console.log(`🗑️ [ADMIN API] Deleting model record: ${id}`);
      
      const { error: deleteError } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ [ADMIN API] Failed to delete model:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete model', details: deleteError.message },
          { status: 500 }
        );
      }

      console.log('✅ [ADMIN API] Model deleted from database successfully');

      // Create notification for the model author about rejection
      try {
        console.log(`📧 [ADMIN API] Creating rejection notification for: ${modelToDelete.author_email}`);
        
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
        console.log('✅ [ADMIN API] Rejection notification created successfully');
      } catch (notificationError) {
        console.error('❌ [ADMIN API] Failed to create rejection notification:', notificationError);
        // Don't fail the whole request if notification creation fails
      }

      return NextResponse.json({ message: 'Model rejected and deleted successfully' });
    }
  } catch (error) {
    console.error('❌ [ADMIN API] Exception in PATCH handler:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}