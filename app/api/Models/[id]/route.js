// /app/api/models/[id]/route.js
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        
        // Try to find in regular models first
        let model = await prisma.model.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        name: true,
                        profileImageUrl: true
                    }
                }
            }
        });
        
        // If not found in models, try archived models
        if (!model) {
            model = await prisma.archivedModel.findUnique({
                where: { id }
            });
        }
        
        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }
        return NextResponse.json(model);
    } catch (error) {
        console.error("Error fetching model:", error);
        return NextResponse.json({ error: "Error fetching model" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = params;
        
        const deleted = await prisma.model.delete({
            where: { id }
        });
        
        if (!deleted) {
            return NextResponse.json({ error: 'Model not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Model deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH handler removed: editing models is no longer allowed.