import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { userDB } from "@/lib/db/supabase-db";

export async function PUT(request) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData = await request.json();
    
    // Get current user data
    const currentUser = await userDB.getUserByEmail(user.email);
    
    // Update user with new data
    const updatedUser = await userDB.upsertUser({
      ...currentUser,
      ...updateData,
      email: user.email // Ensure email doesn't change
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}