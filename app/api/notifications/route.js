import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db/prisma";

// Get user's notifications
export async function GET(req) {
    try {
        const user = await getSupabaseUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userEmail: user.email },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
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

        await prisma.notification.deleteMany({
            where: {
                id: { in: notificationIds },
                userEmail: user.email
            }
        });

        return NextResponse.json({ message: "Notifications deleted successfully" });
    } catch (error) {
        console.error('Error deleting notifications:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}