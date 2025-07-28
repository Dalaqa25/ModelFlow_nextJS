import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
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

        const client = await clientPromise;
        
        const db = client.db();
        
        // First check if the user exists
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' }, 
                { status: 404 }
            );
        }

        // Fetch both regular models and pending models
        const [models, pendingModels] = await Promise.all([
            db.collection('models')
                .find({ authorEmail: email })
                .sort({ createdAt: -1 })
                .toArray(),
            db.collection('pendingmodels')
                .find({ authorEmail: email })
                .sort({ createdAt: -1 })
                .toArray()
        ]);

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