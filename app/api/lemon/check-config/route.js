import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { confgireLemonSqueezy } from "@/lib/lemon/server";

export async function GET(req) {
    try {
        const user = await getSupabaseUser();

        if (!user || user.email !== 'g.dalaqishvili01@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await confgireLemonSqueezy();
        
        return NextResponse.json({
            isConfigured: !error,
            error: error || null
        });
    } catch (error) {
        console.error('Error checking Lemon Squeezy configuration:', error);
        return NextResponse.json({
            isConfigured: false,
            error: error.message || 'Failed to check configuration'
        }, { status: 500 });
    }
} 