import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase-server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';

function getAutomationStoragePath(userId, automationId) {
    // Single folder: user_id_automation_id/
    return `${userId}_${automationId}/`;
}

/**
 * POST /api/automations/upload
 * 
 * Two modes:
 * 1. JSON body with { fileName, fileSize, automationId } → returns a signed upload URL
 *    (for direct client-to-Supabase uploads, bypasses Vercel's body size limit)
 * 2. FormData with file → legacy mode, buffers file through the API route
 *    (works locally but fails on Vercel for files > 4.5MB)
 */
export async function POST(req) {
    console.log('[UPLOAD] Request received');

    try {
        const user = await getSupabaseUser();
        if (!user) {
            console.log('[UPLOAD] No user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[UPLOAD] User authenticated:', user.id);

        const contentType = req.headers.get('content-type') || '';

        // ── Mode 1: JSON → Signed Upload URL ──────────────────────────
        if (contentType.includes('application/json')) {
            const { fileName, fileSize, automationId } = await req.json();

            if (!fileName) {
                return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
            }
            if (!automationId) {
                return NextResponse.json({ error: 'automationId is required' }, { status: 400 });
            }

            const supabaseAdmin = createAdminClient();

            // Fetch automation to get bucket configuration from system_config
            const { data: automation, error: fetchError } = await supabaseAdmin
                .from('automations')
                .select('id, name, system_config')
                .eq('id', automationId)
                .maybeSingle();

            if (fetchError) {
                console.error('[UPLOAD] Database error:', fetchError);
                return NextResponse.json({ error: 'Database error' }, { status: 500 });
            }

            if (!automation) {
                return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
            }

            // Find bucket from system_config
            let bucketName = null;
            let mimeType = 'video/mp4';
            const systemConfig = automation.system_config || [];

            for (const config of systemConfig) {
                const fieldName = (config.name || '').toUpperCase();
                if ((fieldName.includes('STORAGE_PATH') || fieldName.includes('STORAGE_FOLDER')) && config.bucket) {
                    bucketName = config.bucket;
                    if (config.mimeType) {
                        mimeType = config.mimeType;
                    }
                    break;
                }
            }

            if (!bucketName) {
                return NextResponse.json({
                    error: 'This automation does not have storage configured'
                }, { status: 400 });
            }

            // Build storage path
            const storagePath = getAutomationStoragePath(user.id, automation.id);
            const timestamp = Date.now();
            const originalName = fileName || 'video.mp4';
            const filePath = `${storagePath}${timestamp}_${originalName}`;

            console.log('[UPLOAD] Generating signed upload URL:', {
                bucket: bucketName,
                path: filePath,
                fileSize: fileSize ? `${(fileSize / (1024 * 1024)).toFixed(2)}MB` : 'unknown'
            });

            // Generate signed upload URL (valid for 10 minutes)
            const { data: signedData, error: signError } = await supabaseAdmin.storage
                .from(bucketName)
                .createSignedUploadUrl(filePath);

            if (signError) {
                console.error('[UPLOAD] Failed to create signed URL:', signError);
                return NextResponse.json({
                    error: `Failed to prepare upload: ${signError.message}`
                }, { status: 500 });
            }

            // Get the public URL for later reference
            const { data: urlData } = supabaseAdmin.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            console.log('[UPLOAD] Signed upload URL created successfully');

            return NextResponse.json({
                success: true,
                signedUrl: signedData.signedUrl,
                token: signedData.token,
                path: filePath,
                bucket: bucketName,
                publicUrl: urlData?.publicUrl || null,
                contentType: mimeType
            });
        }

        // ── Mode 2: FormData → Legacy buffered upload ─────────────────
        // (Fallback for local development / small files)
        console.log('[UPLOAD] Legacy FormData upload mode');

        const formData = await req.formData();
        const file = formData.get('file');
        const automationId = formData.get('automationId');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (!automationId) {
            return NextResponse.json({ error: 'No automationId provided' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Fetch automation to get bucket configuration
        const { data: automation, error: fetchError } = await supabaseAdmin
            .from('automations')
            .select('id, name, system_config')
            .eq('id', automationId)
            .maybeSingle();

        if (fetchError || !automation) {
            return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
        }

        let bucketName = null;
        let mimeType = 'video/mp4';
        const systemConfig = automation.system_config || [];

        for (const config of systemConfig) {
            const fieldName = (config.name || '').toUpperCase();
            if ((fieldName.includes('STORAGE_PATH') || fieldName.includes('STORAGE_FOLDER')) && config.bucket) {
                bucketName = config.bucket;
                if (config.mimeType) mimeType = config.mimeType;
                break;
            }
        }

        if (!bucketName) {
            return NextResponse.json({ error: 'No storage configured' }, { status: 400 });
        }

        const storagePath = getAutomationStoragePath(user.id, automation.id);
        const timestamp = Date.now();
        const originalName = file.name || 'video.mp4';
        const fileName = `${storagePath}${timestamp}_${originalName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('[UPLOAD] Legacy upload:', originalName, `${(buffer.length / (1024 * 1024)).toFixed(2)}MB`);

        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(fileName, buffer, { contentType: mimeType, upsert: false });

        if (uploadError) {
            console.error('[UPLOAD] Storage error:', uploadError);
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                name: originalName,
                path: fileName,
                bucket: bucketName,
                url: urlData?.publicUrl || null,
                size: buffer.length,
                uploadedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[UPLOAD] Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
