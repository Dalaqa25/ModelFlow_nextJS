import { NextResponse } from 'next/server';
import { archivedModelDB, userDB } from '@/lib/db/supabase-db';

export async function GET(request) {
    try {
        // Get email from query params
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        let plan = 'basic';
        if (email) {
            // Fetch user from Supabase
            const user = await userDB.getUserByEmail(email);
            if (user && user.subscription_plan) {
                plan = user.subscription_plan;
            }
        }

        const models = email
            ? await archivedModelDB.getArchivedModelsByAuthor(email)
            : [];
        
        console.log(`[DEBUG] Found ${models.length} archived models for ${email}`);
        
        // --- Storage usage calculation (same as user-models API) ---
        let totalBytes = 0;
        // List all files in the root of the 'models' bucket
        const { data: allFiles, error: storageError } = await supabase
            .storage
            .from('models')
            .list('', { limit: 1000 });

        if (storageError) {
            console.error('Error listing files in Supabase Storage:', storageError);
            // Still return models, but with storage error
            return NextResponse.json({
                models,
                totalStorageUsedMB: null,
                plan,
                storageError: storageError.message
            });
        }

        console.log(`[DEBUG] Found ${allFiles.length} files in Supabase storage`);
        console.log(`[DEBUG] Supabase files:`, allFiles.map(f => f.name));

        for (const model of models) {
            const supabasePath = model.fileStorage?.supabasePath;
            console.log(`[DEBUG] Model "${model.name}" has supabasePath: ${supabasePath}`);
            
            if (!supabasePath) {
                console.log(`[DEBUG] No supabasePath for model "${model.name}"`);
                continue;
            }
            
            const file = allFiles.find(f => f.name === supabasePath);
            if (file && file.metadata && file.metadata.size) {
                console.log(`[DEBUG] Found file "${supabasePath}" with size: ${file.metadata.size} bytes`);
                totalBytes += file.metadata.size;
            } else {
                console.log(`[DEBUG] File "${supabasePath}" not found in Supabase or has no metadata`);
            }
        }
        
        const totalStorageUsedMB = Number((totalBytes / (1024 * 1024)).toFixed(4));
        console.log(`[DEBUG] Total storage used: ${totalBytes} bytes = ${totalStorageUsedMB} MB`);
        
        return NextResponse.json({ models, totalStorageUsedMB, plan });
    } catch (error) {
        console.error('Error fetching archived models:', error);
        return NextResponse.json({ error: 'Failed to fetch archived models' }, { status: 500 });
    }
} 