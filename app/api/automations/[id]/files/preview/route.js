import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser } from '@/lib/auth/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/automations/[id]/files/preview
 * Generate a signed URL for previewing a file
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

    console.log('[PREVIEW FILE] Generating signed URL:', {
      user_id: user.id,
      automation_id: automationId,
      bucket: bucketName,
      file_path: filePath
    });

    // Security check: Ensure file path starts with user's folder
    if (!filePath.startsWith(expectedFolder)) {
      console.error('[PREVIEW FILE] Security violation: path does not match user folder');
      return NextResponse.json({
        error: 'Access denied: Invalid file path'
      }, { status: 403 });
    }

    // Generate signed URL (expires in 1 hour)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 3600 seconds = 1 hour

    if (signError) {
      console.error('[PREVIEW FILE] Error:', signError);
      return NextResponse.json({
        error: `Failed to generate preview URL: ${signError.message}`
      }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    console.log('[PREVIEW FILE] Successfully generated signed URL');

    return NextResponse.json({
      success: true,
      url: signedUrl.signedUrl,
      expires_at: expiresAt,
      file_name: file_name
    });

  } catch (error) {
    console.error('[PREVIEW FILE] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
