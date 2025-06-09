// /app/api/models/[id]/route.js
import connect from "@/lib/db/connect";
import Model from "@/lib/db/Model";
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
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();
        const model = await Model.findById(params.id);

        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        // Check if the user is the author of the model
        if (model.authorEmail !== user.email) {
            return NextResponse.json({ error: "You can only delete your own models" }, { status: 403 });
        }

        await Model.findByIdAndDelete(params.id);
        return NextResponse.json({ message: "Model deleted successfully" });
    } catch (error) {
        console.error("Error deleting model:", error);
        return NextResponse.json({ error: "Error deleting model" }, { status: 500 });
    }
}