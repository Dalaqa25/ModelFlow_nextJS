import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { earningsDB } from "@/lib/db/supabase-db";

export async function GET() {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const earningsHistory = await earningsDB.getEarningsHistoryByUser(user.email);
        
        return NextResponse.json(earningsHistory);
    } catch (error) {
        console.error('Error fetching earnings history:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
