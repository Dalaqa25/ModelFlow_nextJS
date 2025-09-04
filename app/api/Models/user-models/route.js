import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUser } from '@/lib/auth-utils';
import { modelDB, userDB } from '@/lib/db/supabase-db';

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


        // Fetch models from the unified models table
        const models = await modelDB.getModelsByAuthor(email);

        // Sort by created_at
        const allModels = models.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        // --- Storage usage calculation from file_storage field ---
        let totalBytes = 0;
        let storageError = null;

        try {
            for (const model of allModels) {
                let fileSize = 0;

                // Try to get fileSize from file_storage field
                if (model.file_storage) {
                    try {
                        let fileStorageData = null;

                        // Handle both string and object formats
                        if (typeof model.file_storage === 'string') {
                            fileStorageData = JSON.parse(model.file_storage);
                        } else if (typeof model.file_storage === 'object') {
                            fileStorageData = model.file_storage;
                        }

                        if (fileStorageData && fileStorageData.fileSize) {
                            fileSize = parseInt(fileStorageData.fileSize) || 0;
                        }
                    } catch (parseError) {
                        console.warn('Error parsing file_storage for model', model.id, ':', parseError);
                    }
                }

                // Determine if fileSize is in bytes or KB
                // If fileSize is very small (< 1024), it's likely already in bytes
                // If fileSize is larger, it might be in KB (since 919 bytes would be ~0.9KB)
                // But 919 could also just be a small file in bytes
                // We'll use a more conservative approach: if < 1024, assume bytes; if >= 1024, check if it looks like KB
                if (fileSize > 0) {
                    if (fileSize < 1024) {
                        // Likely in bytes (small files)
                        totalBytes += fileSize;
                    } else if (fileSize >= 1024 && fileSize < 1024 * 1024) {
                        // Could be in KB or bytes - check if it makes sense as KB
                        // If converting from KB to bytes would give a reasonable file size, do it
                        const asKB = fileSize * 1024;
                        if (asKB < 1024 * 1024 * 1024) { // Less than 1GB
                            totalBytes += asKB;
                        } else {
                            // Probably already in bytes
                            totalBytes += fileSize;
                        }
                    } else {
                        // Large number, likely already in bytes
                        totalBytes += fileSize;
                    }
                }
            }
        } catch (storageCalcError) {
            console.error('Error calculating storage usage:', storageCalcError);
            storageError = storageCalcError.message;
        }

        const totalStorageUsedMB = Number((totalBytes / (1024 * 1024)).toFixed(4));

        const response = {
            models: allModels,
            totalStorageUsedMB,
            plan: userData.subscription_plan || 'basic',
            storageError
        };
        
        
        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching user models:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 