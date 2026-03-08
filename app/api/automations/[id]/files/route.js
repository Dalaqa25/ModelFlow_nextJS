import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser } from '@/lib/auth/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/automations/[id]/files
 * List all files uploaded by user for this automation
 */
export async function GET(req, { params }) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const automationId = params.id;

    // Get automation to find bucket from system_config
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

    // Build user's folder path
    const folderPath = `${user.id}_${automationId}/`;

    console.log('[LIST FILES] Listing files:', {
      user_id: user.id,
      automation_id: automationId,
      bucket: bucketName,
      folder: folderPath
    });

    // List files from Supabase Storage
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('[LIST FILES] Error:', listError);
      return NextResponse.json({
        error: `Failed to list files: ${listError.message}`
      }, { status: 500 });
    }

    // Calculate total size and format response
    let totalSize = 0;
    const formattedFiles = (files || []).map(file => {
      totalSize += file.metadata?.size || 0;
      return {
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at,
        mime_type: file.metadata?.mimetype || 'unknown',
        path: `${folderPath}${file.name}`
      };
    });

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      total_count: formattedFiles.length,
      total_size: totalSize,
      bucket: bucketName,
      folder: folderPath
    });

  } catch (error) {
    console.error('[LIST FILES] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
