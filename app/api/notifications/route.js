import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { notificationDB } from "@/lib/db/supabase-db";

// Get user's notifications
export async function GET(req) {
    try {
        const user = await getSupabaseUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notifications = await notificationDB.getNotificationsByUser(user.email);
        return NextResponse.json(notifications);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Delete notifications
export async function PATCH(req) {
    try {
        const user = await getSupabaseUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { notificationIds } = await req.json();
        
        if (!Array.isArray(notificationIds)) {
            return NextResponse.json({ error: "Invalid notification IDs" }, { status: 400 });
        }

        await notificationDB.deleteNotifications(notificationIds);
        return NextResponse.json({ message: "Notifications deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}