import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for backend
);

export async function GET(request) {
    try {
        // Get email from query params
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        let plan = 'basic';
        if (email) {
            // Fetch user from Prisma
            const user = await prisma.user.findUnique({
                where: { email },
                select: { subscription: true }
            });
            if (user && user.subscription?.plan) {
                plan = user.subscription.plan;
            }
        }
        
        const models = email
            ? await prisma.archivedModel.findMany({
                where: { authorEmail: email },
                orderBy: { createdAt: 'desc' }
            })
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