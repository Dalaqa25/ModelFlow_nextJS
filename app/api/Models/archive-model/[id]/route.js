import { NextResponse } from 'next/server';
import connect from '@/lib/db/connect';
import Model from '@/lib/db/Model';
import ArchivedModel from '@/lib/db/ArchivedModel';
import { getSupabaseUser } from '@/lib/auth-utils';

export async function PUT(req, { params }) {
    try {
        const user = await getSupabaseUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await connect();
        const model = await Model.findById(params.id);
        if (!model) {
            return NextResponse.json({ error: 'Model not found' }, { status: 404 });
        }
        if (model.authorEmail !== user.email) {
            return NextResponse.json({ error: 'You can only archive your own models' }, { status: 403 });
        }
        // Create archived model with trimmed fields and preserve original _id
        await ArchivedModel.create({
            _id: model._id, // preserve the original ID
            name: model.name,
            authorEmail: model.authorEmail,
            purchasedBy: model.purchasedBy, // copy purchasedBy
            fileStorage: model.fileStorage,
            createdAt: model.createdAt
        });
        // Remove the original model
        await Model.findByIdAndDelete(params.id);
        return NextResponse.json({ message: 'Model archived successfully' });
    } catch (error) {
        console.error('Error archiving model:', error);
        return NextResponse.json({ error: 'Error archiving model' }, { status: 500 });
    }
} 