import { NextResponse } from "next/server";
import connect from "@/lib/db/connect";
import Model from "@/lib/db/Model";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(req, { params }) {
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

        // Check if user has already liked the model
        if (model.likedBy.includes(user.email)) {
            return NextResponse.json({ error: "Already liked" }, { status: 400 });
        }

        // Add user's email to likedBy array and increment likes count
        model.likedBy.push(user.email);
        model.likes += 1;
        await model.save();

        return NextResponse.json({ likes: model.likes });
    } catch (error) {
        console.error("Error liking model:", error);
        return NextResponse.json({ error: "Error liking model" }, { status: 500 });
    }
} 