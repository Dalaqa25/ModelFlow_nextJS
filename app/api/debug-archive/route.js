import { NextResponse } from 'next/server';
import connect from '@/lib/db/connect';
import ArchivedModel from '@/lib/db/ArchivedModel';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        
        if (!email) {
            return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
        }

        await connect();
        
        // Get archived models from database
        const models = await ArchivedModel.find({ authorEmail: email }).sort({ createdAt: -1 });
        
        // Get files from Supabase
        const { data: allFiles, error: storageError } = await supabase
            .storage
            .from('models')
            .list('', { limit: 1000 });

        const debugInfo = {
            email,
            archivedModelsCount: models.length,
            archivedModels: models.map(model => ({
                id: model._id,
                name: model.name,
                fileStorage: model.fileStorage,
                supabasePath: model.fileStorage?.supabasePath,
                hasFileStorage: !!model.fileStorage,
                hasSupabasePath: !!model.fileStorage?.supabasePath
            })),
            supabaseFilesCount: allFiles?.length || 0,
            supabaseFiles: allFiles?.map(file => ({
                name: file.name,
                size: file.metadata?.size,
                hasMetadata: !!file.metadata
            })) || [],
            storageError: storageError?.message || null
        };

        return NextResponse.json(debugInfo);
    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 