import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth/auth-utils";
import { userDB } from "@/lib/db/supabase-db";
import { startTimer } from "@/lib/utils/perf";

export async function GET() {
  const timer = startTimer("api/user GET");
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await userDB.getUserByEmail(user.email);
    
    if (!userData) {
      const newUser = await userDB.upsertUser({
        email: user.email,
        name: user.user_metadata?.name || 'User',
      });
      timer.end({ status: 200, created: true });
      return NextResponse.json(newUser);
    }

    timer.end({ status: 200 });
    return NextResponse.json(userData);
  } catch (error) {
    timer.end({ status: 500, error: error?.message });
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

        const updatedUser = await userDB.updateUser(user.email, updateData);

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
