import { getSupabaseUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withDatabaseRetry } from "@/lib/db/connection-utils";

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

        console.log('GET /api/user - Connected to database');
        
        let userData = await withDatabaseRetry(async () => {
            return await prisma.user.findFirst({
                where: { email: user.email }
            });
        });
        console.log('GET /api/user - User data from DB:', userData ? 'Found' : 'Not found');

        if (!userData) {
            console.log('GET /api/user - Creating new user in database');
            // If user doesn't exist in our database, create them
            const newUser = await withDatabaseRetry(async () => {
                return await prisma.user.create({
                    data: {
                        name: user.user_metadata?.name || user.email,
                        email: user.email,
                        profileImageUrl: user.user_metadata?.avatar_url || null,
                        aboutMe: "",
                        websiteLink: "",
                        contactEmail: user.email
                    }
                });
            });
            console.log('GET /api/user - New user created:', newUser.id);
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

        const updateData = {
            aboutMe: data.aboutMe,
            websiteLink: data.websiteLink,
            contactEmail: data.contactEmail,
        };

        // Only update profileImageUrl if it's provided
        if (data.profileImageUrl) {
            updateData.profileImageUrl = data.profileImageUrl;
        }

        const updatedUser = await withDatabaseRetry(async () => {
            return await prisma.user.update({
                where: { email: user.email },
                data: updateData
            });
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