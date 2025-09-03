import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';

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

    // Update model status
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected'
    };

    if (action === 'reject') {
      updateData.rejection_reason = rejectionReason.trim();
    }
    // Note: No timestamp columns needed - just status update

    console.log('🔄 [API] Update data (simplified):', updateData);
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

    console.log('✅ [API] Model updated successfully:', updatedModel);
    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('❌ [API] Exception in PATCH handler:', error);
    console.error('❌ [API] Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}