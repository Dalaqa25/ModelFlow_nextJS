import { getSupabaseUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import connect from "@/lib/db/connect";
import User from "@/lib/db/User";

export async function GET() {
    try {
        console.log('GET /api/user - Starting request');
        
        const user = await getSupabaseUser();
        console.log('GET /api/user - User from Supabase:', user ? {
            id: user.id,
            email: user.email,
            hasMetadata: !!user.user_metadata
        } : 'No user');

        if (!user) {
            console.log('GET /api/user - No user found, returning 401');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();
        console.log('GET /api/user - Connected to database');
        
        let userData = await User.findOne({ authId: user.id });
        console.log('GET /api/user - User data from DB:', userData ? 'Found' : 'Not found');

        // If not found by authId, try by email (for migrated/legacy users)
        if (!userData) {
            userData = await User.findOne({ email: user.email });
            if (userData) {
                // Update authId if missing
                if (!userData.authId) {
                    userData.authId = user.id;
                    await userData.save();
                }
                return NextResponse.json(userData);
            }
        }

        if (!userData) {
            console.log('GET /api/user - Creating new user in database');
            // If user doesn't exist in our database, create them
            const newUser = await User.create({
                authId: user.id,
                name: user.user_metadata?.name || user.email,
                email: user.email,
                profileImageUrl: user.user_metadata?.avatar_url || null,
                aboutMe: "",
                websiteLink: "",
                contactEmail: user.email
            });
            console.log('GET /api/user - New user created:', newUser._id);
            return NextResponse.json(newUser);
        }

        console.log('GET /api/user - Returning existing user data');
        return NextResponse.json(userData);
    } catch (error) {
        console.error("Error in GET /api/user:", error);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: error.message 
        }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = await getSupabaseUser();

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