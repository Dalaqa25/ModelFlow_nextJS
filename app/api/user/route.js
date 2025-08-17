import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { userDB } from "@/lib/db/supabase-db";

export async function GET() {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await userDB.getUserByEmail(user.email);
    
    if (!userData) {
      // Create user if doesn't exist
      const newUser = await userDB.upsertUser({
        email: user.email,
        name: user.user_metadata?.name || user.email,
        createdAt: new Date().toISOString(),
        subscription: {
          plan: 'basic',
          status: 'active',
          balance: 0
        }
      });
      return NextResponse.json(newUser);
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        const updateData = {
            about_me: data.aboutMe,
            website_link: data.websiteLink,
            contact_email: data.contactEmail,
        };

        // Only update profileImageUrl if it's provided
        if (data.profileImageUrl) {
            updateData.profile_image_url = data.profileImageUrl;
        }

        const updatedUser = await userDB.upsertUser({
            email: user.email,
            data: updateData
        });

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error in PUT /api/user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}