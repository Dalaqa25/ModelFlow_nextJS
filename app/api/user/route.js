import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();
        const userData = await db.collection("users").findOne({ authId: user.id });

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
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
        const client = await clientPromise;
        const db = client.db();

        // Log the incoming data for debugging
        console.log('Updating user with data:', data);

        const updateData = {
            aboutMe: data.aboutMe,
            websiteLink: data.websiteLink,
            contactEmail: data.contactEmail,
        };

        // Only update profileImageUrl if it's provided
        if (data.profileImageUrl) {
            updateData.profileImageUrl = data.profileImageUrl;
        }

        const updatedUser = await db.collection("users").findOneAndUpdate(
            { authId: user.id },
            { $set: updateData },
            { returnDocument: 'after' }
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