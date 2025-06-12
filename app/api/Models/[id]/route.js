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

export async function PATCH(req, { params }) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();
        const { id } = params;
        
        // Find the model and verify ownership
        const model = await Model.findById(id);
        if (!model) {
            return NextResponse.json({ error: "Model not found" }, { status: 404 });
        }

        if (model.authorEmail !== user.email) {
            return NextResponse.json({ error: "Unauthorized to edit this model" }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, price, tags } = body;

        // Validate required fields
        if (!name || !description) {
            return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
        }

        // Update the model
        const updatedModel = await Model.findByIdAndUpdate(
            id,
            {
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price) || 0,
                tags: tags || []
            },
            { new: true }
        );

        return NextResponse.json(updatedModel);
    } catch (error) {
        console.error("Error updating model:", error);
        return NextResponse.json({ error: "Error updating model" }, { status: 500 });
    }
}