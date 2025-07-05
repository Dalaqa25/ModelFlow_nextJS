#!/bin/bash

echo "🚀 ModelFlow Ngrok Setup Helper"
echo "================================"

echo ""
echo "1. First, start your FastAPI server:"
echo "   cd app/model-validator-api"
echo "   python -m uvicorn main:app --host 0.0.0.0 --port 8000"
echo ""

echo "2. In a new terminal, start ngrok for FastAPI:"
echo "   ngrok http 8000"
echo "   (Copy the https URL it gives you)"
echo ""

echo "3. In another terminal, start ngrok for Next.js:"
echo "   ngrok http 3000"
echo "   (Copy the https URL it gives you)"
echo ""

echo "4. Add these to your .env.local file:"
echo "   NEXT_PUBLIC_MODEL_VALIDATOR_API_URL=https://your-fastapi-ngrok-url"
echo "   NEXT_PUBLIC_APP_URL=https://your-nextjs-ngrok-url"
echo ""

echo "5. Restart your Next.js development server:"
echo "   npm run dev"
echo ""

echo "✅ Setup complete! Your app should now work with ngrok." 