import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
        }

        // Get archived models from database using Supabase
        const { data: models, error: dbError } = await supabase
            .from('archived_models')
            .select('*')
            .eq('author_email', email)
            .order('created_at', { ascending: false });

        if (dbError) throw dbError;
        
        // Get files from Supabase
        const { data: allFiles, error: storageError } = await supabase
            .storage
            .from('models')
            .list('', { limit: 1000 });

        const debugInfo = {
            email,
            archivedModelsCount: models.length,
            archivedModels: models.map(model => ({
                id: model.id,
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