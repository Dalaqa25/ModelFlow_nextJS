import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import connect from '@/lib/db/connect';
import User from '@/lib/db/User';

export async function GET() {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();
    if (!kindeUser || !kindeUser.email || !kindeUser.id) {
        return Response.json({ synced: false, reason: "No Kinde user found" }, { status: 400 });
    }

    await connect();
    const mongoUser = await User.findOne({ authId: kindeUser.id });

    if (mongoUser) {
        return Response.json({ synced: true, user: mongoUser });
    } else {
        const newUser = await User.create({
            authId: kindeUser.id,
            name: kindeUser.given_name,
            last_name: kindeUser.family_name, 
            email: kindeUser.email,
            profileImage: kindeUser.picture,
        });
        return Response.json({ synced: true, user: newUser, created: true });
    }
}