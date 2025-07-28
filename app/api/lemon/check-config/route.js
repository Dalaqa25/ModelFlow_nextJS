import { NextResponse } from "next/server";
import { confgireLemonSqueezy } from "@/lib/lemon/server";

export async function GET(req) {
    try {
        // Remove: const { getUser } = getKindeServerSession();
        // Remove: const user = await getUser();

        // Remove: if (!user || user.email !== 'modelflow01@gmail.com') {
        // Remove:     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // Remove: }

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