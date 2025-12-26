import { userDB } from '@/lib/db/supabase-db';

export async function GET() {
    try {
        // Remove: const { getUser } = getKindeServerSession();
        // Remove: const kindeUser = await getUser();

        // Remove: if (!kindeUser || !kindeUser.email || !kindeUser.id) {
        // Remove:     return Response.json({ synced: false, reason: "No Kinde user found" }, { status: 400 });
        // Remove: }

        const postgresUser = await userDB.getUserByEmail("test@example.com"); // Placeholder for email

        if (postgresUser) {
            // Update existing user with latest data
            const updatedUser = await userDB.updateUser("test@example.com", {
                name: "Test Name", // Placeholder for name
                profile_image_url: "https://via.placeholder.com/150" // Placeholder for profileImageUrl
            });
            return Response.json({ synced: true, user: updatedUser });
        } else {
            // Create new user
            const newUser = await userDB.upsertUser({
                name: "Test Name", // Placeholder for name
                email: "test@example.com", // Placeholder for email
                profile_image_url: "https://via.placeholder.com/150", // Placeholder for profileImageUrl
                about_me: "",
                website_link: "",
                contact_email: "test@example.com" // Placeholder for contactEmail
            });
            return Response.json({ synced: true, user: newUser, created: true });
        }
    } catch (error) {
        return Response.json({ synced: false, error: error.message }, { status: 500 });
    }
}