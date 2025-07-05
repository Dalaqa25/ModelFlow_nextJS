# Ngrok Setup Guide for Model Validator API

## Step 1: Start your FastAPI server

```bash
cd app/model-validator-api
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Step 2: Start ngrok for FastAPI

In a new terminal:
```bash
ngrok http 8000
```

This will give you a URL like: `https://abc123.ngrok-free.app`

## Step 3: Update your Next.js environment variables

Add this to your `.env.local` file:
```env
NEXT_PUBLIC_MODEL_VALIDATOR_API_URL=https://your-ngrok-url-here.ngrok-free.app
```

## Step 4: Start your Next.js app with ngrok

In another terminal:
```bash
ngrok http 3000
```

## Step 5: Test the connection

1. Visit your ngrok Next.js URL
2. Try uploading a model
3. Check the browser console for any errors

## Troubleshooting

### If you get CORS errors:
- Make sure your FastAPI is running on `0.0.0.0:8000` (not just localhost)
- The CORS is now set to allow all origins (`*`)

### If you get "Failed to fetch":
- Check that your FastAPI ngrok URL is correct in `.env.local`
- Make sure both ngrok tunnels are running
- Check that the FastAPI server is actually running

### If you get ngrok errors:
- Make sure you're using the free ngrok plan correctly
- Check that the ports aren't already in use
- Try restarting ngrok

## Example .env.local file:
```env
NEXT_PUBLIC_MODEL_VALIDATOR_API_URL=https://abc123.ngrok-free.app
LEMONSQUEEZY_API_KEY=your_key_here
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=https://def456.ngrok-free.app
``` 