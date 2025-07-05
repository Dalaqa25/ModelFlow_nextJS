"use server"
import { createCustomer, lemonSqueezySetup, createCheckout} from "@lemonsqueezy/lemonsqueezy.js";
import { error } from "console";

// Price to variant ID mapping
const PRICE_TO_VARIANT_MAP = {
    500: "874721",  // $5.00
    1000: "877785", // $10.00
    1500: "877790", // $15.00
    2000: "886672", // $20.00
};

export async function getVariantIdForPrice(price: number): Promise<string | null> {
    // Convert price to cents if it's in dollars
    const priceInCents = price >= 100 ? price : price * 100;
    
    // Find the closest price tier
    const availablePrices = Object.keys(PRICE_TO_VARIANT_MAP).map(Number).sort((a, b) => a - b);
    const closestPrice = availablePrices.reduce((prev, curr) => {
        return Math.abs(curr - priceInCents) < Math.abs(prev - priceInCents) ? curr : prev;
    });
    
    return PRICE_TO_VARIANT_MAP[closestPrice] || null;
}

export async function confgireLemonSqueezy() {
    const requiredVars = [
        "LEMONSQUEEZY_API_KEY",
        "LEMONSQUEEZY_STORE_ID",
        "LEMONSQUEEZY_WEBHOOK_SECRET",
    ]

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
        return {
            error: `Missing requeried LEMONSQUEEZY env variables: ${
                missingVars.join(", ")
            }. Please, set them in your .env file!`,
        }
    }

    lemonSqueezySetup({ apiKey : process.env.LEMONSQUEEZY_API_KEY});
    return { error: null }
}

export async function createNewCustomer(email: string) {
    const { error } = await confgireLemonSqueezy(); 
    if (error) {
        console.error(error);
        return null;
    }

    return createCustomer(process.env.LEMONSQUEEZY_STORE_ID!, {
        name: "user",
        email: email
    })
}

// paymnet configuration
export async function createCheckoutUrl(
    { price, userEmail = "", userId = "", embed = false, modelId = "", modelName = "", authorEmail = ""  } : {
        price: number,
        userEmail?: string,
        userId?: string,
        embed?: boolean,
        modelId?: string,
        modelName?: string,
        authorEmail?: string
    },
) {
    const { error } = await confgireLemonSqueezy();
    if (error) {
        console.error(error);
        return null
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
        console.warn(
            "NEXT_PUBLIC_APP_URL is not defined, using default redirect URL",
        )
        return null
    }

    // Get variant ID based on price
    const variantId = await getVariantIdForPrice(price);
    if (!variantId) {
        console.error(`No variant ID found for price: ${price}`);
        return null;
    }

    const checkoutData: any = {};
    if (userEmail) checkoutData.email = userEmail;
    checkoutData.custom = {
        ...(userId && { user_id: userId }),
        ...(modelId && { modelId }),
        ...(modelName && { modelName }),
        ...(authorEmail && { authorEmail })
    };

    const checkout = await createCheckout(
        process.env.LEMONSQUEEZY_STORE_ID!,
        variantId, 
        {
            checkoutOptions: {
                embed: true,
                media: true,
                logo: !embed,
            },
            checkoutData,
            productOptions: {
                enabledVariants: [parseInt(variantId)],
                redirectUrl: `${
                    process.env.NEXT_PUBLIC_APP_URL || 
                    "http://localhost:3000"
                }/`,
                receiptButtonText: "Go to dashboard",
                receiptThankYouNote: "Thank you for signing up to Lemon Stand!",
            }
        },
    );

    if (!checkout.data?.data?.attributes?.url) {
        console.error("Faild to craete checkout URL")
        return null;
    }

    return checkout.data?.data?.attributes?.url;
}