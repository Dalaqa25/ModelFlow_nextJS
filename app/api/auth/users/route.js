import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import connect from '@/lib/db/connect';
import User from '@/lib/db/User';

export async function GET() {
    try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();
        
        if (!kindeUser || !kindeUser.email || !kindeUser.id) {
            return Response.json({ synced: false, reason: "No Kinde user found" }, { status: 400 });
        }

        await connect();
        const mongoUser = await User.findOne({ authId: kindeUser.id });

        if (mongoUser) {
            // Update existing user with latest Kinde data
            const updatedUser = await User.findOneAndUpdate(
                { authId: kindeUser.id },
                {
                    $set: {
                        name: kindeUser.given_name,
                        email: kindeUser.email,
                        profileImageUrl: kindeUser.picture
                    }
                },
                { new: true }
            );
            return Response.json({ synced: true, user: updatedUser });
        } else {
            // Create new user
            const newUser = await User.create({
                authId: kindeUser.id,
                name: kindeUser.given_name,
                email: kindeUser.email,
                profileImageUrl: kindeUser.picture,
                aboutMe: "",
                websiteLink: "",
                contactEmail: kindeUser.email
            });
            return Response.json({ synced: true, user: newUser, created: true });
        }
    } catch (error) {
        console.error("Error in user sync:", error);
        return Response.json({ synced: false, error: error.message }, { status: 500 });
    }
}