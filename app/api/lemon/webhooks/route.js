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
    const orderId = body.data?.id;
    const totalAmount = body.data?.attributes?.total; // Amount in cents

    // Extract modelId from custom data
    const modelId = customData?.model_id;
    const modelName = customData?.model_name;
    const authorEmail = customData?.author_email;

    if (!buyerEmail || !modelId) {
      return NextResponse.json({ error: "Missing buyer email or modelId" }, { status: 400 });
    }

    await connect();

    // Find the buyer
    const buyer = await User.findOne({ email: buyerEmail });
    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Find the model
    const model = await Model.findById(modelId);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Check if already purchased
    const alreadyPurchased = buyer.purchasedModels.some(p => p.modelId.toString() === modelId);
    if (alreadyPurchased) {
      return NextResponse.json({ message: "Model already purchased" }, { status: 200 });
    }

    // Add to buyer's purchased models
    buyer.purchasedModels.push({
      modelId: model._id,
      purchasedAt: new Date(),
      price: model.price
    });
    await buyer.save();

    // Update seller's earnings
    if (authorEmail) {
      const seller = await User.findOne({ email: authorEmail });
      if (seller) {
        // Calculate seller's cut (you can adjust this percentage)
        const sellerCut = Math.floor(totalAmount * 0.8); // 80% to seller, 20% platform fee
        
        // Update total earnings
        seller.totalEarnings += sellerCut;
        
        // Add to earnings history
        seller.earningsHistory.push({
          modelId: model._id,
          modelName: modelName || model.name,
          buyerEmail: buyerEmail,
          amount: sellerCut,
          lemonSqueezyOrderId: orderId,
          earnedAt: new Date()
        });
        
        await seller.save();
        console.log(`Updated seller earnings: ${authorEmail} earned ${sellerCut} cents`);
      }
    }

    return NextResponse.json({ message: "Purchase processed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
