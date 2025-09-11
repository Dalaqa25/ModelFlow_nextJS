import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { earningsDB } from "@/lib/db/supabase-db";

export async function GET() {
    try {
        const user = await getSupabaseUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rawEarningsHistory = await earningsDB.getEarningsHistoryByUser(user.email);
        
        // Transform the data to match component expectations
        const transformedEarnings = rawEarningsHistory.map(transaction => ({
            id: transaction.id,
            model_name: transaction.model?.name || 'Unknown Model',
            buyer_email: transaction.buyer_email,
            amount: transaction.price, // price is stored in cents
            earned_at: transaction.created_at,
            release_at: transaction.release_at,
            status: transaction.status,
            lemon_squeezy_order_id: transaction.lemon_squeezy_order_id
        }));
        
        return NextResponse.json(transformedEarnings);
    } catch (error) {
        console.error('Error fetching earnings history:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
