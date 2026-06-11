#!/bin/bash
# ============================================================================
# VIXOR P0 Security Setup — Environment Variables + Webhook Configuration
# ============================================================================
# PREREQUISITE: Run `npx vercel login` first to authenticate with Vercel
# Then run this script: bash scripts/setup-p0-security.sh
# ============================================================================

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  VIXOR P0 Security Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Generate Secrets ──
echo "🔑 Step 1: Generating secrets..."

TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)

echo "  TELEGRAM_WEBHOOK_SECRET: $TELEGRAM_WEBHOOK_SECRET"
echo "  CRON_SECRET: $CRON_SECRET"
echo ""

# ── Step 2: Add to Vercel ──
echo "☁️  Step 2: Adding environment variables to Vercel..."

# Link project if not already linked
if [ ! -f ".vercel/project.json" ]; then
  echo "  Linking Vercel project..."
  npx vercel link --yes
fi

# Add TELEGRAM_WEBHOOK_SECRET
echo "  Adding TELEGRAM_WEBHOOK_SECRET..."
npx vercel env add TELEGRAM_WEBHOOK_SECRET production <<< "$TELEGRAM_WEBHOOK_SECRET"
npx vercel env add TELEGRAM_WEBHOOK_SECRET preview <<< "$TELEGRAM_WEBHOOK_SECRET"

# Add CRON_SECRET
echo "  Adding CRON_SECRET..."
npx vercel env add CRON_SECRET production <<< "$CRON_SECRET"
npx vercel env add CRON_SECRET preview <<< "$CRON_SECRET"

echo "  ✅ Environment variables added!"
echo ""

# ── Step 3: Save secrets locally for reference ──
SECRETS_FILE="/home/z/my-project/.env.secrets"
cat > "$SECRETS_FILE" << EOF
# ═══ VIXOR P0 Security — Generated Secrets ═══
# ⚠️  DO NOT COMMIT THIS FILE — It is in .gitignore
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

TELEGRAM_WEBHOOK_SECRET=$TELEGRAM_WEBHOOK_SECRET
CRON_SECRET=$CRON_SECRET
EOF

echo "💾 Secrets saved to .env.secrets (git-ignored)"
echo ""

# ── Step 4: Get project domain for Telegram webhook ──
echo "🌐 Step 4: Getting Vercel project domain..."

# Try to get the project domain from Vercel
PROJECT_DOMAIN=$(npx vercel ls 2>/dev/null | head -2 | tail -1 | awk '{print $1}' || echo "")

if [ -z "$PROJECT_DOMAIN" ]; then
  echo "  ⚠️  Could not auto-detect domain. You'll need to set the webhook manually."
  echo ""
  echo "  Run this command with your actual values:"
  echo ""
  echo "  curl -X POST \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook\" \\"
  echo "    -H \"Content-Type: application/json\" \\"
  echo "    -d '{"
  echo "      \"url\": \"https://<YOUR_DOMAIN>.vercel.app/api/telegram-webhook\","
  echo "      \"secret_token\": \"$TELEGRAM_WEBHOOK_SECRET\""
  echo "    }'"
else
  echo "  Domain: $PROJECT_DOMAIN"
  echo ""
  echo "  To set Telegram webhook, run:"
  echo ""
  echo "  export BOT_TOKEN=your_telegram_bot_token"
  echo "  curl -X POST \"https://api.telegram.org/bot\${BOT_TOKEN}/setWebhook\" \\"
  echo "    -H \"Content-Type: application/json\" \\"
  echo "    -d '{"
  echo "      \"url\": \"https://$PROJECT_DOMAIN/api/telegram-webhook\","
  echo "      \"secret_token\": \"$TELEGRAM_WEBHOOK_SECRET\""
  echo "    }'"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ P0 Security Setup Complete!"
echo ""
echo "  NEXT STEPS:"
echo "  1. Set the Telegram webhook (command above)"
echo "  2. Deploy to Vercel: npx vercel --prod"
echo "  3. Test cron: curl -H \"Authorization: Bearer $CRON_SECRET\" https://YOUR_DOMAIN/api/check-alerts"
echo "═══════════════════════════════════════════════════════════"
