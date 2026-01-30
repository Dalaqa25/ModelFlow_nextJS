#!/bin/bash

echo "🔍 Pre-Flight Check for Automation Testing"
echo "========================================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
else
    echo "❌ .env.local file not found"
    exit 1
fi

# Check required environment variables
echo ""
echo "Checking environment variables..."

check_env() {
    if grep -q "^$1=" .env.local; then
        value=$(grep "^$1=" .env.local | cut -d '=' -f2)
        if [ -n "$value" ]; then
            echo "✅ $1 is set"
        else
            echo "❌ $1 is empty"
        fi
    else
        echo "❌ $1 is missing"
    fi
}

check_env "GOOGLE_CLIENT_ID"
check_env "GOOGLE_CLIENT_SECRET"
check_env "GOOGLE_REDIRECT_URI"
check_env "NEXT_PUBLIC_SUPABASE_URL"
check_env "SUPABASE_SERVICE_ROLE_KEY"

# Check if node_modules exists
echo ""
if [ -d "node_modules" ]; then
    echo "✅ node_modules found"
else
    echo "⚠️  node_modules not found - run 'npm install'"
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
fi

echo ""
echo "========================================================"
echo "Pre-flight check complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000/test-automation"
echo "3. Test your automation runner backend"
echo ""
