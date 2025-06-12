import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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

        // Then fetch their models
        console.log('Fetching models for user...');
        const models = await db.collection('models')
            .find({ authorEmail: email })
            .sort({ createdAt: -1 })
            .toArray();
        console.log(`Found ${models.length} models`);

        return NextResponse.json(models || []);
    } catch (error) {
        console.error('Detailed error in user-models API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user models', details: error.message }, 
            { status: 500 }
        );
    }
} 