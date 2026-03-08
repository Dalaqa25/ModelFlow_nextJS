import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser } from '@/lib/auth/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/automations/[id]/files/delete
 * Delete a specific file from user's automation storage
 * 
 * Body: { file_name: "video.mp4" }
 */
export async function POST(req, { params }) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const automationId = params.id;
    const { file_name } = await req.json();

    if (!file_name) {
      return NextResponse.json({ error: 'file_name is required' }, { status: 400 });
    }

    // Get automation to find bucket
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('id, name, system_config')
      .eq('id', automationId)
      .single();

    if (automationError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Find bucket from system_config
    const systemConfig = automation.system_config || [];
    let bucketName = null;

    for (const config of systemConfig) {
      const fieldName = (config.name || '').toUpperCase();
      if ((fieldName.includes('STORAGE_PATH') || fieldName.includes('STORAGE_FOLDER')) && config.bucket) {
        bucketName = config.bucket;
        break;
      }
    }

    if (!bucketName) {
      return NextResponse.json({
        error: 'This automation does not have storage configured'
      }, { status: 400 });
    }

    // Build expected file path
    const expectedFolder = `${user.id}_${automationId}/`;
    const filePath = `${expectedFolder}${file_name}`;

    console.log('[DELETE FILE] Deleting:', {
      user_id: user.id,
      automation_id: automationId,
      bucket: bucketName,
      file_path: filePath
    });

    // Security check: Ensure file path starts with user's folder
    if (!filePath.startsWith(expectedFolder)) {
      console.error('[DELETE FILE] Security violation: path does not match user folder');
      return NextResponse.json({
        error: 'Access denied: Invalid file path'
      }, { status: 403 });
    }

    // Delete file from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (deleteError) {
      console.error('[DELETE FILE] Error:', deleteError);
      return NextResponse.json({
        error: `Failed to delete file: ${deleteError.message}`
      }, { status: 500 });
    }

    console.log('[DELETE FILE] Successfully deleted:', filePath);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      deleted_file: file_name
    });

  } catch (error) {
    console.error('[DELETE FILE] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
