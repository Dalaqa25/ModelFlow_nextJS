import connect from '@/lib/db/connect';
import User from '@/lib/db/User';

export async function GET() {
    try {
        // Remove: const { getUser } = getKindeServerSession();
        // Remove: const kindeUser = await getUser();
        
        // Remove: if (!kindeUser || !kindeUser.email || !kindeUser.id) {
        // Remove:     return Response.json({ synced: false, reason: "No Kinde user found" }, { status: 400 });
        // Remove: }

        await connect();
        const mongoUser = await User.findOne({ authId: "test_auth_id" }); // Placeholder for authId

        if (mongoUser) {
            // Update existing user with latest Kinde data
            const updatedUser = await User.findOneAndUpdate(
                { authId: "test_auth_id" }, // Placeholder for authId
                {
                    $set: {
                        name: "Test Name", // Placeholder for name
                        email: "test@example.com", // Placeholder for email
                        profileImageUrl: "https://via.placeholder.com/150" // Placeholder for profileImageUrl
                    }
                },
                { new: true }
            );
            return Response.json({ synced: true, user: updatedUser });
        } else {
            // Create new user
            const newUser = await User.create({
                authId: "test_auth_id", // Placeholder for authId
                name: "Test Name", // Placeholder for name
                email: "test@example.com", // Placeholder for email
                profileImageUrl: "https://via.placeholder.com/150", // Placeholder for profileImageUrl
                aboutMe: "",
                websiteLink: "",
                contactEmail: "test@example.com" // Placeholder for contactEmail
            });
            return Response.json({ synced: true, user: newUser, created: true });
        }
    } catch (error) {
        console.error("Error in user sync:", error);
        return Response.json({ synced: false, error: error.message }, { status: 500 });
    }
}