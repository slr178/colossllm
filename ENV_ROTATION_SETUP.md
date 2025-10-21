# Bitquery Token Rotation Setup

## ✅ Smart Strategy!

Creating multiple free Bitquery accounts and rotating tokens is a clever way to work within free tier limits!

## How to Set Up:

### Step 1: Create Multiple Bitquery Accounts

1. Go to https://account.bitquery.io/
2. Sign up with different emails (use +aliases if needed):
   - `youremail+bitquery1@gmail.com`
   - `youremail+bitquery2@gmail.com`
   - `youremail+bitquery3@gmail.com`
   - etc.
3. Generate OAuth token for each account
4. You'll have multiple `ory_at_...` tokens

### Step 2: Add Tokens to .env

```bash
# Primary Bitquery Token
NEXT_PUBLIC_BITQUERY_TOKEN=ory_at_your_first_token_here

# Rotation Tokens (add as many as you want)
NEXT_PUBLIC_BITQUERY_TOKEN_2=ory_at_your_second_token_here
NEXT_PUBLIC_BITQUERY_TOKEN_3=ory_at_your_third_token_here
NEXT_PUBLIC_BITQUERY_TOKEN_4=ory_at_your_fourth_token_here
NEXT_PUBLIC_BITQUERY_TOKEN_5=ory_at_your_fifth_token_here
# Add more as needed...
```

### Step 3: Restart Server

```bash
Get-Process node | Stop-Process -Force
npm run dev
```

## How It Works:

### Automatic Rotation:

1. System starts with `BITQUERY_TOKEN` (primary)
2. When it hits 402 quota error → automatically switches to `BITQUERY_TOKEN_2`
3. When that exhausts → switches to `BITQUERY_TOKEN_3`
4. And so on...
5. After 1 hour, all tokens reset and rotation starts over

### Console Output:

```
🔄 Loaded 5 Bitquery tokens for rotation
✅ Using token #1

[... some time later when quota hits ...]

⚠️ Token quota exhausted, rotating...
🔄 Switched to token #2
🔄 Retrying with rotated token...
✅ Query successful

📊 Token status: 4/5 available
```

## Benefits:

✅ **No downtime** - Instant failover to next token  
✅ **5-10x more quota** - Multiply your free tier limits  
✅ **Automatic** - No manual intervention needed  
✅ **Smart reset** - Clears exhausted list after 1 hour  
✅ **Status tracking** - See how many tokens are available  

## Recommended Setup:

**Minimum:** 3-5 tokens (good for testing/development)
**Recommended:** 5-10 tokens (production ready)
**Maximum:** As many as you want!

## Example .env with 5 Tokens:

```bash
# Bitquery Tokens (rotate when exhausted)
NEXT_PUBLIC_BITQUERY_TOKEN=your_bitquery_token_here
NEXT_PUBLIC_BITQUERY_TOKEN_2=ory_at_SecondTokenHere...
NEXT_PUBLIC_BITQUERY_TOKEN_3=ory_at_ThirdTokenHere...
NEXT_PUBLIC_BITQUERY_TOKEN_4=ory_at_FourthTokenHere...
NEXT_PUBLIC_BITQUERY_TOKEN_5=ory_at_FifthTokenHere...

# AI Model APIs
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
# ... etc
```

## Tips:

- Use email aliases (`youremail+1@gmail.com`, `youremail+2@gmail.com`)
- All go to same inbox
- Create 5-10 accounts in one sitting
- Copy all tokens into .env at once
- System handles the rest automatically!

This is way smarter than upgrading to paid tier if you're just testing or running at moderate scale! 🎯

