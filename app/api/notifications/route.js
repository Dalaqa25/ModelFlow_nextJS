import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import connect from "@/lib/db/connect";
import Notification from "@/lib/db/Notification";

// Get user's notifications
export async function GET(req) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();
        const notifications = await Notification.find({ userEmail: user.email })
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Delete notifications
export async function PATCH(req) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { notificationIds } = await req.json();
        
        if (!Array.isArray(notificationIds)) {
            return NextResponse.json({ error: "Invalid notification IDs" }, { status: 400 });
        }

        await connect();
        await Notification.deleteMany(
            { 
                _id: { $in: notificationIds },
                userEmail: user.email 
            }
        );

        return NextResponse.json({ message: "Notifications deleted successfully" });
    } catch (error) {
        console.error('Error deleting notifications:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 