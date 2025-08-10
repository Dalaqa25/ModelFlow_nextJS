import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSupabaseUser } from '@/lib/auth-utils';

export async function PUT(req, { params }) {
    try {
        const user = await getSupabaseUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const model = await prisma.model.findUnique({
            where: { id: params.id }
        });
        if (!model) {
            return NextResponse.json({ error: 'Model not found' }, { status: 404 });
        }
        if (model.authorEmail !== user.email) {
            return NextResponse.json({ error: 'You can only archive your own models' }, { status: 403 });
        }
        
        // Create archived model with trimmed fields and preserve original ID
        await prisma.archivedModel.create({
            data: {
                id: model.id, // preserve the original ID
                name: model.name,
                authorEmail: model.authorEmail,
                purchasedBy: model.purchasedBy, // copy purchasedBy
                fileStorage: model.fileStorage,
                createdAt: model.createdAt
            }
        });
        
        // Remove the original model
        await prisma.model.delete({
            where: { id: params.id }
        });
        
        return NextResponse.json({ message: 'Model archived successfully' });
    } catch (error) {
        console.error('Error archiving model:', error);
        return NextResponse.json({ error: 'Error archiving model' }, { status: 500 });
    }
}