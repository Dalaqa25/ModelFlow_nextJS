import { NextResponse } from 'next/server';
import { withReadRetry } from '@/lib/db/connection-utils';
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

        // Use retry logic for all database operations
        const result = await withReadRetry(async () => {
            const { prisma } = await import("@/lib/db/prisma");
            
            // First check if the user exists
            const user = await prisma.user.findUnique({
                where: { email }
            });
            
            if (!user) {
                throw new Error('User not found');
            }

            // Fetch both regular models and pending models
            const [models, pendingModels] = await Promise.all([
                prisma.model.findMany({
                    where: { authorEmail: email },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.pendingModel.findMany({
                    where: { authorEmail: email },
                    orderBy: { createdAt: 'desc' }
                })
            ]);

            // Combine both arrays and sort by createdAt
            const allModels = [...models, ...pendingModels].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            return {
                user,
                allModels
            };
        });

        // --- Storage usage calculation ---
        let totalBytes = 0;
        let storageError = null;
        
        try {
            // List all files in the root of the 'models' bucket
            const { data: allFiles, error: supabaseError } = await supabase
                .storage
                .from('models')
                .list('', { limit: 1000 });

            if (supabaseError) {
                console.error('Error listing files in Supabase Storage:', supabaseError);
                storageError = supabaseError.message;
            } else {
                for (const model of result.allModels) {
                    const supabasePath = model.fileStorage?.supabasePath;
                    if (!supabasePath) continue;
                    const file = allFiles.find(f => f.name === supabasePath);
                    if (file && file.metadata && file.metadata.size) {
                        totalBytes += file.metadata.size;
                    }
                }
            }
        } catch (storageCalcError) {
            console.error('Error calculating storage usage:', storageCalcError);
            storageError = storageCalcError.message;
        }
        
        const totalStorageUsedMB = Number((totalBytes / (1024 * 1024)).toFixed(4));

        return NextResponse.json({
            models: result.allModels,
            totalStorageUsedMB,
            plan: result.user.subscription?.plan || 'basic',
            ...(storageError && { storageError })
        });
    } catch (error) {
        console.error('Detailed error in user-models API:', error);
        
        if (error.message === 'User not found') {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(
            { 
                error: 'Failed to fetch user models', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
} 