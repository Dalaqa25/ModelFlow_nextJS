import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withDatabaseRetry } from '@/lib/db/connection-utils';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser } from '@/lib/auth-utils';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for backend
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        let email = searchParams.get('email');

        // If no email parameter, get it from authenticated user
        if (!email) {
            const user = await getSupabaseUser();
            if (!user) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
            email = user.email;
        }

        // First check if the user exists with retry logic
        const user = await withDatabaseRetry(async () => {
            return await prisma.user.findUnique({
                where: { email }
            });
        });
        
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch both regular models and pending models with retry logic
        const [models, pendingModels] = await withDatabaseRetry(async () => {
            return await Promise.all([
                prisma.model.findMany({
                    where: { authorEmail: email },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.pendingModel.findMany({
                    where: { authorEmail: email },
                    orderBy: { createdAt: 'desc' }
                })
            ]);
        });

        // Combine both arrays and sort by createdAt
        const allModels = [...models, ...pendingModels].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        // --- Storage usage calculation ---
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
                models: allModels,
                totalStorageUsedMB: null,
                storageError: storageError.message
            });
        }

        for (const model of allModels) {
            const supabasePath = model.fileStorage?.supabasePath;
            if (!supabasePath) continue;
            const file = allFiles.find(f => f.name === supabasePath);
            if (file && file.metadata && file.metadata.size) {
                totalBytes += file.metadata.size;
            }
        }
        const totalStorageUsedMB = Number((totalBytes / (1024 * 1024)).toFixed(4));

        return NextResponse.json({
            models: allModels,
            totalStorageUsedMB,
            plan: user.subscription?.plan || 'basic'
        });
    } catch (error) {
        console.error('Detailed error in user-models API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user models', details: error.message }, 
            { status: 500 }
        );
    }
} 