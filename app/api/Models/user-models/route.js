import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();
        
        const models = await db.collection('models')
            .find({ authorEmail: user.email })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json(models);
    } catch (error) {
        console.error('Error fetching user models:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 