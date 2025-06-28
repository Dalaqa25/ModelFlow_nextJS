import { NextResponse } from "next/server";
import User from "@/lib/db/User";
import Model from "@/lib/db/Model";
import connect from "@/lib/db/connect";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Lemon Squeezy Webhook received:", body);

    // Only handle order_created events
    if (body.meta?.event_name !== "order_created") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    // Extract buyer email and custom data
    const buyerEmail = body.data?.attributes?.user_email;
    const customData = body.meta?.custom_data || body.data?.attributes?.custom_data;

    // Extract modelId from custom data
    const modelId = customData?.model_id;

    if (!buyerEmail || !modelId) {
      return NextResponse.json({ error: "Missing buyer email or modelId" }, { status: 400 });
    }

    await connect();

    // Find the user
    const user = await User.findOne({ email: buyerEmail });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the model
    const model = await Model.findById(modelId);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Check if already purchased
    const alreadyPurchased = user.purchasedModels.some(p => p.modelId.toString() === modelId);
    if (alreadyPurchased) {
      return NextResponse.json({ message: "Model already purchased" }, { status: 200 });
    }

    // Add to purchased models
    user.purchasedModels.push({
      modelId: model._id,
      purchasedAt: new Date(),
      price: model.price
    });
    await user.save();

    return NextResponse.json({ message: "Purchase processed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
