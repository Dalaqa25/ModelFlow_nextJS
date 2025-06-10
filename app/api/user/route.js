import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import connect from "@/lib/db/connect";
import User from "@/lib/db/User";

export async function GET() {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();
        const userData = await User.findOne({ authId: user.id });

        if (!userData) {
            // If user doesn't exist in our database, create them
            const newUser = await User.create({
                authId: user.id,
                name: user.given_name,
                email: user.email,
                profileImageUrl: user.picture,
                aboutMe: "",
                websiteLink: "",
                contactEmail: user.email
            });
            return NextResponse.json(newUser);
        }

        return NextResponse.json(userData);
    } catch (error) {
        console.error("Error in GET /api/user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        await connect();

        const updateData = {
            aboutMe: data.aboutMe,
            websiteLink: data.websiteLink,
            contactEmail: data.contactEmail,
        };

        // Only update profileImageUrl if it's provided
        if (data.profileImageUrl) {
            updateData.profileImageUrl = data.profileImageUrl;
        }

        const updatedUser = await User.findOneAndUpdate(
            { authId: user.id },
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error in PUT /api/user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 