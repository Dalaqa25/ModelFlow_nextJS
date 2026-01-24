#!/bin/bash

echo "🔍 Pre-Flight Check for Multi-Tenant Automation Testing"
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

check_env "N8N_BASE_URL"
check_env "X-N8N-API-KEY"
check_env "GOOGLE_CLIENT_ID"
check_env "GOOGLE_CLIENT_SECRET"
check_env "GOOGLE_REDIRECT_URI"
check_env "NEXT_PUBLIC_SUPABASE_URL"
check_env "SUPABASE_SERVICE_ROLE_KEY"

# Check if n8n is accessible
echo ""
echo "Checking n8n connection..."
N8N_URL=$(grep "^N8N_BASE_URL=" .env.local | cut -d '=' -f2)
N8N_KEY=$(grep "^X-N8N-API-KEY=" .env.local | cut -d '=' -f2)

if [ -n "$N8N_URL" ] && [ -n "$N8N_KEY" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-N8N-API-KEY: $N8N_KEY" "$N8N_URL/api/v1/workflows")
    if [ "$response" = "200" ]; then
        echo "✅ n8n is accessible and API key is valid"
    else
        echo "⚠️  n8n connection failed (HTTP $response)"
        echo "   Make sure n8n is running at: $N8N_URL"
    fi
else
    echo "⚠️  Cannot check n8n connection (missing URL or API key)"
fi

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
echo "2. Open: http://localhost:3000/test-n8n"
echo "3. Follow TEST_NOW.md for testing instructions"
echo ""
