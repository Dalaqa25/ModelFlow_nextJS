// /app/api/models/[id]/route.js
import connect from "@/lib/db/connect";
import Model from "@/lib/db/Model";
import ArchivedModel from "@/lib/db/ArchivedModel";
import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(req, { params }) {
    await connect();
    try {
        const { id } = await params;
        const model = await Model.findById(id).populate("author", "name profileImage");
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
        await connect();
        const { id } = params;
        const deleted = await Model.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Model not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Model deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH handler removed: editing models is no longer allowed.