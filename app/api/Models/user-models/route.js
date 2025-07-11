import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for backend
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        console.log('Received request for email:', email);

        if (!email) {
            console.log('No email provided in request');
            return NextResponse.json(
                { error: 'Email parameter is required' }, 
                { status: 400 }
            );
        }

        console.log('Connecting to MongoDB...');
        const client = await clientPromise;
        console.log('MongoDB connection successful');
        
        const db = client.db();
        console.log('Using database:', db.databaseName);
        
        // First check if the user exists
        console.log('Looking for user with email:', email);
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            console.log('User not found in database');
            return NextResponse.json(
                { error: 'User not found' }, 
                { status: 404 }
            );
        }
        console.log('User found:', user._id);

        // Fetch both regular models and pending models
        console.log('Fetching models for user...');
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

        console.log(`Found ${allModels.length} total models (${models.length} regular, ${pendingModels.length} pending)`);

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
        const totalStorageUsedMB = Number((totalBytes / (1024 * 1024)).toFixed(2));

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