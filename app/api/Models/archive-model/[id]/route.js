import { NextResponse } from 'next/server';
import { modelDB, archivedModelDB } from '@/lib/db/supabase-db';
import { getSupabaseUser } from '@/lib/auth-utils';

export async function PUT(_req, { params }) {
    try {
        const user = await getSupabaseUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const model = await modelDB.getModelById(params.id);
        if (!model) {
            return NextResponse.json({ error: 'Model not found' }, { status: 404 });
        }
        if (model.author_email !== user.email) {
            return NextResponse.json({ error: 'You can only archive your own models' }, { status: 403 });
        }

        // Archive the model using the archive function
        await archivedModelDB.archiveModel(params.id);

        return NextResponse.json({ message: 'Model archived successfully' });
    } catch (error) {
        console.error('Error archiving model:', error);
        return NextResponse.json({ error: 'Error archiving model' }, { status: 500 });
    }
}