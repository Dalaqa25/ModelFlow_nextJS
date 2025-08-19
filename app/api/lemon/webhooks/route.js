import { NextResponse } from "next/server";
import { modelDB, userDB, purchaseDB } from "@/lib/db/supabase-db";
import crypto from "crypto";
import {
  updateUserBalance,
  calculateSellerCut,
  validateWebhookSaleData
} from "@/lib/lemon/balanceUtils";

// Webhook signature validation function
function verifyWebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret) {
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody, 'utf8');
  const expectedSignature = hmac.digest('hex');
  
  // Remove 'sha256=' prefix if present
  const cleanSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(cleanSignature, 'hex')
  );
}

export async function POST(req) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('x-signature');
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Only handle order_created events
    if (body.meta?.event_name !== "order_created") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    // Validate and extract webhook data
    const { buyerEmail, modelId, modelName, authorEmail, orderId, totalAmount } = validateWebhookSaleData(body);

    // Find the buyer
    const buyer = await userDB.getUserByEmail(buyerEmail);
    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Find the model
    const model = await modelDB.getModelById(modelId);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Check if already purchased
    const userPurchases = await purchaseDB.getPurchasedModelsByUser(buyerEmail);
    const alreadyPurchased = userPurchases.some(p => p.model_id === modelId);
    if (alreadyPurchased) {
      return NextResponse.json({ message: "Model already purchased" }, { status: 200 });
    }

    // Create transaction record
    await purchaseDB.createPurchase({
      buyer_email: buyerEmail,
      seller_email: model.author_email,
      model_id: model.id,
      price: model.price,
      lemon_squeezy_order_id: orderId,
      status: 'completed'
    });

    // Update model downloads count
    await modelDB.updateModel(model.id, {
      downloads: (model.downloads || 0) + 1
    });

    // Update seller's earnings using the balance utility
    const sellerCut = calculateSellerCut(totalAmount); // 80% to seller, 20% platform fee
    
    const balanceUpdate = await updateUserBalance(authorEmail, {
      modelId: model.id,
      modelName: modelName || model.name,
      buyerEmail: buyerEmail,
      amount: sellerCut,
      lemonSqueezyOrderId: orderId,
      earnedAt: new Date()
    });

    console.log('Balance updated for seller:', {
      email: balanceUpdate.email,
      totalEarnings: balanceUpdate.totalEarnings,
      availableBalance: balanceUpdate.availableBalance,
      newEarningAmount: balanceUpdate.newEarning.amount
    });

    return NextResponse.json({ message: "Purchase processed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
