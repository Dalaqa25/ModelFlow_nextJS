import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth-utils";
import { modelDB, userDB, purchaseDB } from "@/lib/db/supabase-db";
import { updateUserBalance, calculateSellerCut } from "@/lib/lemon/balanceUtils";

export async function POST(req) {
    try {
        const user = await getSupabaseUser();

        if (!user || user.email !== 'g.dalaqishvili01@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Create a test model if none exists
        const existingModels = await modelDB.getModelsByAuthor("g.dalaqishvili01@gmail.com");
        let testModel = existingModels.find(m => m.name === "Test Model for Webhook");
        
        if (!testModel) {
            const testUser = await userDB.getUserByEmail("g.dalaqishvili01@gmail.com");
            if (!testUser) {
                return NextResponse.json({ error: "Test user not found" }, { status: 404 });
            }

            testModel = await modelDB.createModel({
                name: "Test Model for Webhook",
                author_email: "g.dalaqishvili01@gmail.com",
                tags: ["test"],
                description: "This is a test model for webhook testing",
                features: ["Test features"],
                use_cases: ["Test use cases"],
                setup: "Test setup",
                price: 50000, // $500.00 in cents
                file_storage: {
                    type: "zip",
                    url: "https://example.com/test.zip",
                    fileName: "test.zip"
                }
            });
        }

        // Create a test user if none exists
        let testBuyer = await userDB.getUserByEmail("test@example.com");
        if (!testBuyer) {
            testBuyer = await userDB.upsertUser({
                email: "test@example.com",
                name: "Test User"
            });
        }

        // Simulate webhook data
        const testWebhookData = {
            meta: {
                event_name: "order_created",
                custom_data: {
                    model_id: testModel.id,
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
        const buyer = testBuyer;
        const model = testModel;

        // Check if already purchased
        const userPurchases = await purchaseDB.getPurchasedModelsByUser(testBuyer.email);
        const alreadyPurchased = userPurchases.some(p => p.model_id === testModel.id);
        if (alreadyPurchased) {
            return NextResponse.json({
                message: "Test completed - model already purchased by test user",
                testData: testWebhookData
            });
        }

        // Create transaction record
        await purchaseDB.createPurchase({
            buyer_email: buyer.email,
            seller_email: model.author_email,
            model_id: model.id,
            price: model.price,
            lemon_squeezy_order_id: testWebhookData.data.id,
            status: 'completed'
        });

        // Update seller's earnings using the balance utility
        const sellerCut = calculateSellerCut(500); // 80% to seller, 20% platform fee
        
        const balanceUpdate = await updateUserBalance(testModel.authorEmail, {
            modelId: model.id,
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