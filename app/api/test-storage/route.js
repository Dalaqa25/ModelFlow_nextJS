
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/supabase-server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';

function getAutomationStoragePath(userId, automationId) {
    // Single folder: user_id_automation_id/
    return `${userId}_${automationId}/`;
}

export async function POST(req) {
    try {
        const user = await getSupabaseUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { automationId } = await req.json();

        if (!automationId) {
            return NextResponse.json({ error: 'automationId is required' }, { status: 400 });
        }

        const supabase = createClient();

        // 1. Fetch automation details (Use Service Role to bypass RLS)
        // We use admin client here because the user might not have read access to the 'automations' table
        // but still needs to execute the logic based on it.
        console.log(`[TEST STORAGE] Fetching automation: ${automationId} (using Service Role)`);

        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: automation, error: fetchError } = await supabaseAdmin
            .from('automations')
            .select('id, name, required_inputs')
            .eq('id', automationId)
            .single();

        if (fetchError) {
            console.error('[TEST STORAGE] Database Error (Admin):', fetchError);
            return NextResponse.json({ error: `Database Error: ${fetchError.message}` }, { status: 500 });
        }

        if (!automation) {
            console.error('[TEST STORAGE] Automation not found (null result)');
            return NextResponse.json({ error: 'Automation not found in database. Check the ID.' }, { status: 404 });
        }

        // 2. Check for bucket configuration in required_inputs
        let bucketName = null;
        let storageField = null;
        let mimeType = 'text/plain'; // Default fallback

        const requiredInputs = automation.required_inputs || [];

        for (const input of requiredInputs) {
            const fieldName = (input.name || input).toUpperCase();

            // Check if this is a storage field and has a bucket
            if ((fieldName.includes('STORAGE_PATH') || fieldName.includes('STORAGE_FOLDER')) && input.bucket) {
                bucketName = input.bucket;
                storageField = fieldName;
                if (input.mimeType) {
                    mimeType = input.mimeType;
                }
                break;
            }
        }

        if (!bucketName) {
            return NextResponse.json({
                success: false,
                message: 'No storage bucket configured for this automation. Please add "bucket": "your-bucket-name" to required_inputs.'
            });
        }

        // 3. Generate path (no file created - folder will exist when real files are uploaded)
        const storagePath = getAutomationStoragePath(user.id, automation.id);

        return NextResponse.json({
            success: true,
            message: `Storage configuration verified! Path ready for use.`,
            details: {
                bucket: bucketName,
                path: storagePath,
                mimeType: mimeType,
                automationName: automation.name
            }
        });

    } catch (error) {
        console.error('Test route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
