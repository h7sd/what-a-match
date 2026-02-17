#!/bin/bash

# Cloudflare Worker API Proxy - Configuration Check
# Run this to verify your setup is correct

echo "=========================================="
echo "API Proxy Configuration Check"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: DNS Resolution
echo "1. Checking DNS for api.uservault.cc..."
if host api.uservault.cc > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} DNS configured"
    host api.uservault.cc | head -n 1
else
    echo -e "${RED}✗${NC} DNS not configured"
    echo "   → Configure CNAME record: api → uservault.cc"
fi
echo ""

# Check 2: Worker Reachability
echo "2. Checking if Worker is reachable..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.uservault.cc/rest/v1/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗${NC} Worker not reachable (connection failed)"
    echo "   → Deploy Worker and configure route"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}✗${NC} Worker deployed but route not configured"
    echo "   → Add route: api.uservault.cc/*"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓${NC} Worker is reachable (HTTP $HTTP_CODE)"
else
    echo -e "${YELLOW}?${NC} Worker returned HTTP $HTTP_CODE"
fi
echo ""

# Check 3: Discord OAuth Callback
echo "3. Checking Discord OAuth callback endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.uservault.cc/functions/v1/discord-oauth-callback 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗${NC} Callback endpoint not reachable"
elif [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Callback endpoint is working (HTTP $HTTP_CODE)"
else
    echo -e "${YELLOW}?${NC} Callback returned HTTP $HTTP_CODE"
fi
echo ""

# Check 4: CORS Headers
echo "4. Checking CORS headers..."
CORS_HEADER=$(curl -s -I https://api.uservault.cc/rest/v1/ 2>/dev/null | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
    echo -e "${GREEN}✓${NC} CORS headers present"
    echo "   $CORS_HEADER"
else
    echo -e "${RED}✗${NC} CORS headers missing"
    echo "   → Check Worker code has corsHeaders configured"
fi
echo ""

# Check 5: Check .env file
echo "5. Checking .env configuration..."
if [ -f "../.env" ]; then
    SUPABASE_URL=$(grep "VITE_SUPABASE_URL" ../.env | cut -d '=' -f 2)
    if [[ "$SUPABASE_URL" == *"api.uservault.cc"* ]]; then
        echo -e "${GREEN}✓${NC} .env uses API proxy: $SUPABASE_URL"
        echo -e "${YELLOW}⚠${NC}  Make sure Worker is deployed before using this!"
    elif [[ "$SUPABASE_URL" == *"supabase.co"* ]]; then
        echo -e "${YELLOW}⚠${NC}  .env uses direct Supabase URL: $SUPABASE_URL"
        echo "   → Change to https://api.uservault.cc after deploying Worker"
    else
        echo -e "${RED}✗${NC} .env has unexpected URL: $SUPABASE_URL"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
fi
echo ""

# Check 6: Discord OAuth URL in code
echo "6. Checking Discord OAuth configuration in code..."
OAUTH_URL=$(grep -A 2 "getRedirectUri" ../src/hooks/useDiscordOAuth.ts | grep "return" | head -n 1)
if [[ "$OAUTH_URL" == *"api.uservault.cc"* ]]; then
    echo -e "${GREEN}✓${NC} Code uses API proxy for Discord redirect"
elif [[ "$OAUTH_URL" == *"supabase.co"* ]]; then
    echo -e "${YELLOW}⚠${NC}  Code uses direct Supabase URL for Discord redirect"
    echo "   → Consider using API proxy for better security"
else
    echo -e "${RED}✗${NC} Could not determine redirect URI configuration"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "If Worker is NOT deployed:"
echo "  1. Deploy Worker to Cloudflare (see DEPLOYMENT_GUIDE.md)"
echo "  2. Configure DNS: api.uservault.cc → Worker"
echo "  3. Add route: api.uservault.cc/*"
echo "  4. Update Discord Developer Portal redirect URI"
echo "  5. Re-run this script to verify"
echo ""
echo "If Worker IS deployed:"
echo "  1. Update Discord Developer Portal:"
echo "     → https://api.uservault.cc/functions/v1/discord-oauth-callback"
echo "  2. Test Discord login on your app"
echo "  3. Check browser dev tools (no Supabase URL should be visible)"
echo ""
echo "=========================================="
