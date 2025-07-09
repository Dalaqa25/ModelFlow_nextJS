import { NextResponse } from 'next/server';
import connect from '@/lib/db/connect';
import ArchivedModel from '@/lib/db/ArchivedModel';

export async function GET() {
    try {
        await connect();
        const models = await ArchivedModel.find({}).sort({ createdAt: -1 });
        // Calculate total storage used in MB
        const totalBytes = models.reduce((sum, model) => sum + (model.fileStorage?.fileSize || 0), 0);
        const totalStorageUsedMB = Number((totalBytes / (1024 * 1024)).toFixed(2));
        return NextResponse.json({ models, totalStorageUsedMB });
    } catch (error) {
        console.error('Error fetching archived models:', error);
        return NextResponse.json({ error: 'Failed to fetch archived models' }, { status: 500 });
    }
} 