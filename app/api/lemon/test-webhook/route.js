import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import User from "@/lib/db/User";
import Model from "@/lib/db/Model";
import connect from "@/lib/db/connect";
import { updateUserBalance, calculateSellerCut } from "@/lib/lemon/balanceUtils";

export async function POST(req) {
    try {
        const user = await getSupabaseUser();

        if (!user || user.email !== 'g.dalaqishvili01@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connect();

        // Create a test model if none exists
        let testModel = await Model.findOne({ name: "Test Model for Webhook" });
        if (!testModel) {
            const testUser = await User.findOne({ email: "g.dalaqishvili01@gmail.com" });
            if (!testUser) {
                return NextResponse.json({ error: "Test user not found" }, { status: 404 });
            }

            testModel = await Model.create({
                name: "Test Model for Webhook",
                author: testUser._id,
                authorEmail: "g.dalaqishvili01@gmail.com",
                tags: ["test"],
                description: "This is a test model for webhook testing",
                features: "Test features",
                useCases: "Test use cases",
                setup: "Test setup",
                price: 500, // $5.00
                fileStorage: {
                    type: "zip",
                    url: "https://example.com/test.zip",
                    fileName: "test.zip"
                }
            });
        }

        // Create a test user if none exists
        let testBuyer = await User.findOne({ email: "test@example.com" });
        if (!testBuyer) {
            testBuyer = await User.create({
                authId: "test-auth-id",
                email: "test@example.com",
                name: "Test User"
            });
        }

        // Simulate webhook data
        const testWebhookData = {
            meta: {
                event_name: "order_created",
                custom_data: {
                    model_id: testModel._id.toString(),
                    model_name: testModel.name,
                    author_email: testModel.authorEmail
                }
            },
            data: {
                id: "test-order-" + Date.now(),
                attributes: {
                    user_email: testBuyer.email,
                    total: 500 // $5.00 in cents
                }
            }
        };

        // Process the test webhook
        const buyer = await User.findOne({ email: testBuyer.email });
        const model = await Model.findById(testModel._id);

        // Check if already purchased
        const alreadyPurchased = buyer.purchasedModels.some(p => p.modelId.toString() === testModel._id.toString());
        if (alreadyPurchased) {
            return NextResponse.json({ 
                message: "Test completed - model already purchased by test user",
                testData: testWebhookData
            });
        }

        // Add to buyer's purchased models
        buyer.purchasedModels.push({
            modelId: model._id,
            purchasedAt: new Date(),
            price: model.price
        });
        await buyer.save();

        // Update seller's earnings using the balance utility
        const sellerCut = calculateSellerCut(500); // 80% to seller, 20% platform fee
        
        const balanceUpdate = await updateUserBalance(testModel.authorEmail, {
            modelId: model._id,
            modelName: model.name,
            buyerEmail: buyer.email,
            amount: sellerCut,
            lemonSqueezyOrderId: testWebhookData.data.id,
            earnedAt: new Date()
        });

        return NextResponse.json({
            message: "Test webhook processed successfully",
            testData: testWebhookData,
            buyerUpdated: true,
            sellerUpdated: true,
            balanceUpdate: {
                email: balanceUpdate.email,
                totalEarnings: balanceUpdate.totalEarnings,
                availableBalance: balanceUpdate.availableBalance,
                newEarningAmount: balanceUpdate.newEarning.amount
            }
        });

    } catch (error) {
        console.error('Test webhook error:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to process test webhook'
        }, { status: 500 });
    }
} 