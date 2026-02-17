import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/db/supabase-server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { compressVideoServer, needsCompression } from '@/lib/utils/server-video-compressor';

function getAutomationStoragePath(userId, automationId) {
    // Single folder: user_id_automation_id/
    return `${userId}_${automationId}/`;
}

export async function POST(req) {
    console.log('[UPLOAD] Request received');
    
    try {
        const user = await getSupabaseUser();
        if (!user) {
            console.log('[UPLOAD] No user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[UPLOAD] User authenticated:', user.id);
        console.log('[UPLOAD] Attempting to parse FormData...');
        
        const formData = await req.formData();
        console.log('[UPLOAD] FormData parsed successfully');
        
        const file = formData.get('file');
        const automationId = formData.get('automationId');
        const userAutomationId = formData.get('userAutomationId');

        console.log('[UPLOAD] FormData contents:', {
            hasFile: !!file,
            fileName: file?.name,
            fileSize: file?.size,
            fileSizeMB: file?.size ? (file.size / (1024 * 1024)).toFixed(2) + 'MB' : 'N/A',
            automationId,
            userAutomationId
        });

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!automationId) {
            return NextResponse.json({ error: 'No automationId provided' }, { status: 400 });
        }

        const supabase = createClient();
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

        // Find bucket from system_config (not required_inputs)
        let bucketName = null;
        let mimeType = 'video/mp4'; // Default for videos
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

        // Generate path and filename
        const storagePath = getAutomationStoragePath(user.id, automation.id);
        const timestamp = Date.now();
        const originalName = file.name || 'video.mp4';
        const extension = originalName.split('.').pop() || 'mp4';
        const fileName = `${storagePath}${timestamp}_${originalName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);

        const originalSizeMB = buffer.length / (1024 * 1024);
        console.log('[UPLOAD] Original file size:', originalSizeMB.toFixed(2) + 'MB');

        // Compress video if needed (for videos over 20MB)
        const isVideo = file.type?.startsWith('video/') || extension.match(/mp4|mov|avi|webm|mkv/i);
        if (isVideo && needsCompression(buffer.length, 20)) {
            console.log('[UPLOAD] File over 20MB, compressing on server...');
            try {
                const compressed = await compressVideoServer(buffer, originalName, {
                    targetSizeMB: 35 // Target 35MB to have buffer under 50MB limit
                });
                buffer = compressed.buffer;
                
                const compressedSizeMB = buffer.length / (1024 * 1024);
                console.log('[UPLOAD] Compression successful, new size:', compressedSizeMB.toFixed(2) + 'MB');
                
                // Validate compressed file is under 50MB
                if (buffer.length > 50 * 1024 * 1024) {
                    console.error('[UPLOAD] Compressed file still over 50MB:', compressedSizeMB.toFixed(2) + 'MB');
                    return NextResponse.json({
                        error: `Your video file is too large to upload. Please use a shorter video or reduce the quality.`
                    }, { status: 413 });
                }
                
            } catch (compressionError) {
                console.error('[UPLOAD] Compression failed:', compressionError);
                return NextResponse.json({
                    error: 'Your video file could not be processed. Please try a different video.'
                }, { status: 500 });
            }
        } else if (buffer.length > 50 * 1024 * 1024) {
            // Non-video files or videos under 20MB that are still over 50MB
            return NextResponse.json({
                error: `Your file is too large to upload. Please use a smaller file.`
            }, { status: 413 });
        }

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: false // Don't overwrite existing files
            });

        if (uploadError) {
            console.error('[UPLOAD] Storage error:', uploadError);
            return NextResponse.json({
                error: `Upload failed: ${uploadError.message}`
            }, { status: 500 });
        }

        // Get public URL (if bucket is public) or signed URL
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


