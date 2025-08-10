import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        // Remove: const { getUser } = getKindeServerSession();
        // Remove: const kindeUser = await getUser();
        
        // Remove: if (!kindeUser || !kindeUser.email || !kindeUser.id) {
        // Remove:     return Response.json({ synced: false, reason: "No Kinde user found" }, { status: 400 });
        // Remove: }

        const postgresUser = await prisma.user.findFirst({
            where: { email: "test@example.com" } // Placeholder for email
        });

        if (postgresUser) {
            // Update existing user with latest data
            const updatedUser = await prisma.user.update({
                where: { email: "test@example.com" }, // Placeholder for email
                data: {
                    name: "Test Name", // Placeholder for name
                    profileImageUrl: "https://via.placeholder.com/150" // Placeholder for profileImageUrl
                }
            });
            return Response.json({ synced: true, user: updatedUser });
        } else {
            // Create new user
            const newUser = await prisma.user.create({
                data: {
                    name: "Test Name", // Placeholder for name
                    email: "test@example.com", // Placeholder for email
                    profileImageUrl: "https://via.placeholder.com/150", // Placeholder for profileImageUrl
                    aboutMe: "",
                    websiteLink: "",
                    contactEmail: "test@example.com" // Placeholder for contactEmail
                }
            });
            return Response.json({ synced: true, user: newUser, created: true });
        }
    } catch (error) {
        console.error("Error in user sync:", error);
        return Response.json({ synced: false, error: error.message }, { status: 500 });
    }
}