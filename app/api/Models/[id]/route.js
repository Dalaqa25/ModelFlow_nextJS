// /app/api/models/[id]/route.js
import connect from "@/lib/db/connect";
import Model from "@/lib/db/Model";
import { NextResponse } from "next/server";

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