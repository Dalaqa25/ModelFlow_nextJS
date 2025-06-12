import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        
        const models = await db.collection('models')
            .find({ authorEmail: email })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json(models);
    } catch (error) {
        console.error('Error fetching user models:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 