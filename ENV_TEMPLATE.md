# Complete .env.local Template

Copy this entire template to your `.env.local` file and fill in your values:

```bash
# ============================================
# BITQUERY API (Four.meme Token Streaming)
# ============================================
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_qn-zAKqaGHOGIFpTFCar3nuLyC5rEqNlI9oNO40NWOg.dYZxhmSKBHnOGpACd9gEVPn5jtCY4vhC-AArKm7o4cI

# ============================================
# AI MODEL API KEYS (For Analysis & Decision Making)
# ============================================

# DeepSeek API
NEXT_PUBLIC_DEEPSEEK_API_KEY=sk-your_deepseek_api_key_here
NEXT_PUBLIC_DEEPSEEK_API_BASE=https://api.deepseek.com

# OpenAI API (GPT-4, GPT-5)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic API (Claude)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# xAI API (Grok)
NEXT_PUBLIC_XAI_API_KEY=xai-your_xai_api_key_here
NEXT_PUBLIC_XAI_API_BASE=https://api.x.ai

# Alibaba Cloud API (Qwen)
NEXT_PUBLIC_QWEN_API_KEY=your_qwen_api_key_here
NEXT_PUBLIC_QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1

# Google AI API (Gemini)
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_ai_api_key_here

# ============================================
# AI #1 - DeepSeek MAX
# Trading on Asterdex + Binance
# ============================================
NEXT_PUBLIC_AI1_ASTERDEX_API_KEY=your_asterdex_key_1
NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET=your_asterdex_secret_1
NEXT_PUBLIC_AI1_BINANCE_WALLET=0x_your_wallet_address_1
NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY=0x_your_private_key_1

# ============================================
# AI #2 - GPT-5
# Trading on Asterdex + Binance
# ============================================
NEXT_PUBLIC_AI2_ASTERDEX_API_KEY=your_asterdex_key_2
NEXT_PUBLIC_AI2_ASTERDEX_API_SECRET=your_asterdex_secret_2
NEXT_PUBLIC_AI2_BINANCE_WALLET=0x_your_wallet_address_2
NEXT_PUBLIC_AI2_BINANCE_PRIVATE_KEY=0x_your_private_key_2

# ============================================
# AI #3 - GROK-4
# Trading on Asterdex + Binance
# ============================================
NEXT_PUBLIC_AI3_ASTERDEX_API_KEY=your_asterdex_key_3
NEXT_PUBLIC_AI3_ASTERDEX_API_SECRET=your_asterdex_secret_3
NEXT_PUBLIC_AI3_BINANCE_WALLET=0x_your_wallet_address_3
NEXT_PUBLIC_AI3_BINANCE_PRIVATE_KEY=0x_your_private_key_3

# ============================================
# AI #4 - Qwen 3 Max
# Trading on Asterdex + Binance
# ============================================
NEXT_PUBLIC_AI4_ASTERDEX_API_KEY=your_asterdex_key_4
NEXT_PUBLIC_AI4_ASTERDEX_API_SECRET=your_asterdex_secret_4
NEXT_PUBLIC_AI4_BINANCE_WALLET=0x_your_wallet_address_4
NEXT_PUBLIC_AI4_BINANCE_PRIVATE_KEY=0x_your_private_key_4

# ============================================
# AI #5 - Gemini 2.5 Pro
# Trading on Asterdex + Binance
# ============================================
NEXT_PUBLIC_AI5_ASTERDEX_API_KEY=your_asterdex_key_5
NEXT_PUBLIC_AI5_ASTERDEX_API_SECRET=your_asterdex_secret_5
NEXT_PUBLIC_AI5_BINANCE_WALLET=0x_your_wallet_address_5
NEXT_PUBLIC_AI5_BINANCE_PRIVATE_KEY=0x_your_private_key_5

# ============================================
# OPTIONAL: Additional Services
# ============================================

# CoinGecko API (for price data)
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_key_here

# TradingView API (for charts/TA)
NEXT_PUBLIC_TRADINGVIEW_API_KEY=your_tradingview_key_here

# Telegram Bot (for notifications)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

## 📋 What Each AI Needs:

### For AI Model APIs (Analysis & Decisions):
- **DeepSeek**: Get from https://platform.deepseek.com/
- **OpenAI**: Get from https://platform.openai.com/api-keys
- **Anthropic**: Get from https://console.anthropic.com/
- **xAI (Grok)**: Get from https://x.ai/api
- **Qwen**: Get from https://dashscope.console.aliyun.com/
- **Google (Gemini)**: Get from https://makersuite.google.com/app/apikey

### For Trading Accounts (Already Added):
- ✅ Asterdex API keys (for futures trading)
- ✅ Binance wallets (for Four.meme token trading)
- ✅ Private keys (for signing transactions)

## 🎯 Usage:

These AI API keys will be used for:

1. **Technical Analysis**
   - Chart pattern recognition
   - Support/resistance detection
   - Trend analysis

2. **Image Analysis**
   - Token logo verification
   - Community meme quality
   - Social media sentiment

3. **Decision Making**
   - Should I trade this token?
   - What's the risk level?
   - Entry/exit points

4. **Natural Language Processing**
   - Analyze token descriptions
   - Social media sentiment
   - News impact assessment

## 📝 Your Current .env.local Should Look Like:

```bash
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_qn-zAKqaGHOGIFpTFCar3nuLyC5rEqNlI9oNO40NWOg...

# AI Model APIs (ADD THESE)
NEXT_PUBLIC_DEEPSEEK_API_KEY=sk-...
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_XAI_API_KEY=xai-...
NEXT_PUBLIC_QWEN_API_KEY=...
NEXT_PUBLIC_GOOGLE_API_KEY=...

# Trading APIs (YOU ALREADY ADDED)
NEXT_PUBLIC_AI1_ASTERDEX_API_KEY=...
NEXT_PUBLIC_AI1_ASTERDEX_API_SECRET=...
NEXT_PUBLIC_AI1_BINANCE_WALLET=0x...
NEXT_PUBLIC_AI1_BINANCE_PRIVATE_KEY=0x...

# ... (repeat for AI2-AI5)
```

Just add the AI model API keys section and you'll be ready for image/TA analysis integration! 🚀
