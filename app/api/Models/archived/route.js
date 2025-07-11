import { NextResponse } from 'next/server';
import connect from '@/lib/db/connect';
import ArchivedModel from '@/lib/db/ArchivedModel';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
    try {
        // Get email from query params
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        let plan = 'basic';
        if (email) {
            // Fetch user from MongoDB
            const client = await clientPromise;
            const db = client.db();
            const user = await db.collection('users').findOne({ email });
            if (user && user.subscription?.plan) {
                plan = user.subscription.plan;
            }
        }
        await connect();
        const models = await ArchivedModel.find({}).sort({ createdAt: -1 });
        // Calculate total storage used in MB
        const totalBytes = models.reduce((sum, model) => sum + (model.fileStorage?.fileSize || 0), 0);
        const totalStorageUsedMB = Number((totalBytes / (1024 * 1024)).toFixed(2));
        return NextResponse.json({ models, totalStorageUsedMB, plan });
    } catch (error) {
        console.error('Error fetching archived models:', error);
        return NextResponse.json({ error: 'Failed to fetch archived models' }, { status: 500 });
    }
} 