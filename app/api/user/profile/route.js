import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email parameter is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Return only necessary user data
        const userData = {
            name: user.name,
            email: user.email,
            contactEmail: user.contactEmail,
            websiteLink: user.websiteLink,
            aboutMe: user.aboutMe,
            profileImageUrl: user.profileImageUrl,
            createdAt: user.createdAt
        };

        return NextResponse.json(userData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 