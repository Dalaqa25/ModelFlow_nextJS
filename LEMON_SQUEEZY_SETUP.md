# Lemon Squeezy Integration Setup

This document explains how the Lemon Squeezy integration works in your ModelFlow application.

## Overview

The Lemon Squeezy integration allows users to purchase AI models through a secure checkout process. When a user purchases a model, the system:

1. Creates a checkout URL with the appropriate price variant
2. Processes the purchase through Lemon Squeezy
3. Receives webhook notifications when orders are completed
4. Updates the buyer's purchased models and seller's earnings

## Price to Variant Mapping

The system uses a fixed mapping between prices and Lemon Squeezy variant IDs:

| Price | Variant ID | Description |
|-------|------------|-------------|
| $5.00 | 874721 | Basic tier |
| $10.00 | 877785 | Standard tier |
| $15.00 | 877790 | Premium tier |
| $20.00 | 886672 | Professional tier |

## Required Environment Variables

Add these to your `.env` file:

```env
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## Setup Steps

### 1. Create Lemon Squeezy Products

1. Go to your Lemon Squeezy dashboard
2. Create products with the variant IDs listed above
3. Set the prices to match the mapping (e.g., variant 874721 should be $5.00)

### 2. Configure Webhooks

1. In your Lemon Squeezy dashboard, go to Settings > Webhooks
2. Add a new webhook with the URL: `https://yourapp.com/api/lemon/webhooks`
3. Select the `order_created` event
4. Save the webhook

### 3. Test the Integration

1. Go to `/admin/lemon-squeezy` in your app
2. Check that all environment variables are configured
3. Use the "Test Webhook" button to verify the webhook is working
4. Upload a test model and try purchasing it

## How It Works

### Purchase Flow

1. User clicks "Purchase" on a model page
2. System generates a checkout URL using the model's price
3. User is redirected to Lemon Squeezy checkout
4. After successful payment, Lemon Squeezy sends a webhook
5. System processes the webhook and updates the database

### Webhook Processing

The webhook handler (`/api/lemon/webhooks`) does the following:

1. Verifies the webhook is for an `order_created` event
2. Extracts buyer email and model information
3. Adds the model to the buyer's purchased models
4. Updates the seller's earnings (80% of the sale price)
5. Records the transaction in the seller's earnings history

### Earnings Calculation

- Platform fee: 20% of the sale price
- Seller earnings: 80% of the sale price
- All amounts are stored in cents for precision

## Admin Features

### Lemon Squeezy Management Page

Visit `/admin/lemon-squeezy` to:

- Check configuration status
- View price-to-variant mappings
- Test webhook functionality
- See setup instructions

### Model Approval

When approving models in the admin panel:

1. The model is moved from pending to approved
2. The price determines which Lemon Squeezy variant will be used
3. Users can immediately purchase the model

## Troubleshooting

### Common Issues

1. **Checkout URL not generating**: Check that all environment variables are set
2. **Webhook not receiving**: Verify the webhook URL is correct in Lemon Squeezy
3. **Purchase not processing**: Check the webhook logs for errors

### Debugging

- Check the browser console for checkout URL generation errors
- Monitor the webhook endpoint logs for processing errors
- Use the test webhook feature to verify functionality

## Security

- All webhook processing is done server-side
- Environment variables are used for sensitive configuration
- Admin access is restricted to the specified email address
- Webhook verification can be added for additional security

## Future Enhancements

- Add webhook signature verification
- Support for dynamic pricing
- Multiple payment methods
- Subscription-based models
- Refund handling 