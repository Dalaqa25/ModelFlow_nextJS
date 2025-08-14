import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser } from '@/lib/auth-utils';
import { modelDB, pendingModelDB, userDB } from '@/lib/db/supabase-db';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        let email = searchParams.get('email');
        let authenticatedUser = null;

        // If no email parameter, get it from authenticated user
        if (!email) {
            authenticatedUser = await getSupabaseUser();
            if (!authenticatedUser) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
            email = authenticatedUser.email;
        }

        // Get user data - create user if doesn't exist
        let userData = await userDB.getUserByEmail(email);
        if (!userData) {
            // Create user if doesn't exist
            userData = await userDB.upsertUser({
                email: email,
                name: email.split('@')[0], // Use email prefix as name
                subscription_plan: 'basic'
            });
        }

        // Fetch both regular models and pending models
        const [models, pendingModels] = await Promise.all([
            modelDB.getModelsByAuthor(email),
            pendingModelDB.getPendingModelsByAuthor(email)
        ]);

        // Combine both arrays and sort by created_at
        const allModels = [...models, ...pendingModels].sort((a, b) =>
            new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
        );

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
                for (const model of allModels) {
                    let supabasePath = null;

                    // Try to get supabasePath from different possible locations
                    if (model.fileStorage?.supabasePath) {
                        supabasePath = model.fileStorage.supabasePath;
                    } else if (model.img_url) {
                        // Parse JSON from img_url field
                        try {
                            const fileStorage = JSON.parse(model.img_url);
                            supabasePath = fileStorage?.supabasePath;
                        } catch (e) {
                            // Ignore parsing errors
                        }
                    }

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
            models: allModels,
            totalStorageUsedMB,
            plan: userData.subscription_plan || 'basic',
            storageError
        });
    } catch (error) {
        console.error('Error fetching user models:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 