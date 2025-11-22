# Gemini API Troubleshooting

## Error: "You exceeded your current quota"

### What Happened?

You've reached the Gemini API free tier limit for image generation.

```
Status: 429 (RESOURCE_EXHAUSTED)
Error: You exceeded your current quota
Details: Quota exceeded for metric: 
  generativelanguage.googleapis.com/generate_content_free_tier_requests
```

---

## Free Tier Limits

| Metric | Limit |
|--------|-------|
| Daily Requests | 50 |
| Requests per Minute | 2 |
| Input Tokens per Minute | 32,000 |
| Request Size | 20 MB |

**Once you hit ANY of these limits, the API returns 429 error.**

---

## Solutions (Choose One)

### ✅ Solution 1: Wait for Reset (FREE)

- **Free tier resets every 24 hours at UTC midnight**
- Calculate your local reset time: [time.is/UTC](https://time.is/UTC)
- No action needed - retry after reset

**How to check reset time:**
```
Go to Google Cloud Console > Quotas
You'll see next reset time for each metric
```

---

### ✅ Solution 2: Use Manual Image Upload (FREE)

Stop using AI image generation and upload images manually:

1. **Edit Service** > Click on image section
2. **Select Upload option** (instead of "สร้างรูป")
3. **Choose image** from your computer
4. **Save service**

This way:
- ✅ No quota used
- ✅ Full control over images
- ✅ Works immediately
- ✅ Better quality (professional photos)

---

### ✅ Solution 3: Upgrade to Paid Plan

Get 1,000+ requests per day:

**Steps:**

1. Go to [Google AI Studio](https://aistudio.google.com/app/home)
2. Click "Get Started" → "API Keys"
3. Select your project
4. Go to [Google Cloud Console](https://console.cloud.google.com)
5. Navigate to **Billing** > **Account Management**
6. Click **Add Payment Method**
7. Enter credit card information
8. Enable billing

**Result:**
- Immediate access to higher quotas
- API key works the same way
- No code changes needed
- Pay only for what you use

**Pricing:**
- First $100/month: free trial
- After that: $0.10 - $15 per million tokens (varies by model)

---

## How to Avoid Quota Issues

### Strategy 1: Hybrid Approach (RECOMMENDED)

```
- Upload professional photos for 80% of services
- Use AI to generate for 20% of services
- This keeps you well within free tier
```

### Strategy 2: Batch Generation

```
- Generate images once per week
- Plan ahead which services need AI images
- 7 services × 7 days = 49 requests (under 50 limit)
```

### Strategy 3: Selective AI Generation

```
- Generate only for new services
- Reuse images for similar services
- Don't regenerate (unless needed)
```

---

## Monitor Your Usage

### In Real-Time (Live)

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Go to **IAM & Admin** > **Quotas**
3. Filter: `generativelanguage.googleapis.com`
4. Look for:
   - `generate_content_free_tier_requests`
   - See **Current Usage** vs **Limit**

### In Browser Console

When you try to generate an image and quota is exceeded:

```javascript
❌ Gemini Image Gen Error: Quota Exceeded - Free tier limit reached
Details: {
  status: 'RESOURCE_EXHAUSTED',
  message: 'You exceeded your current quota...',
  timestamp: '2025-11-23T10:30:00.000Z'
}
```

---

## What Happens After Quota Reset?

1. **At UTC midnight:** Quota resets automatically
2. **Requests count:** Resets to 0
3. **No action needed:** API works again
4. **Limits apply again:** Until next reset

**Example Timeline:**
```
2025-11-23 14:00 UTC - Your last request (quota full)
2025-11-24 00:00 UTC - QUOTA RESETS ✅
2025-11-24 00:05 UTC - Can generate images again
```

---

## Cost Comparison

| Option | Cost | Setup | Speed |
|--------|------|-------|-------|
| Free Tier | $0 | 5 min | Slow (wait 24h) |
| Manual Upload | $0 | 2 min | Instant |
| Paid Plan | $0-15/mo | 10 min | Instant + unlimited |

**Recommendation:**
- **Start:** Manual upload + Free tier for special cases
- **When:** You need 100+ images or generate daily → Upgrade to paid

---

## Frequently Asked Questions

**Q: When exactly does free tier reset?**
A: Every 24 hours from your first request. Check Google Cloud Console for exact time.

**Q: Can I reset quota manually?**
A: No, only time resets it. Must wait 24 hours.

**Q: If I delete a service, does quota reset?**
A: No, quota is based on API usage, not stored data.

**Q: Can I use multiple API keys to get more quota?**
A: Technically yes, but each key has same limits. Better to upgrade one key.

**Q: Does paid plan have quotas?**
A: Yes, but much higher (1,000+ per day). Can request higher limits if needed.

**Q: How much does it cost to generate 1 image?**
A: Free tier: $0 (limited to 50/day)
   Paid tier: ~$0.0005-$0.01 per image (depends on image size)

**Q: Can I upload images in bulk instead?**
A: Yes! This is actually recommended for production use.

**Q: Will upgrading to paid give me my quota back immediately?**
A: Yes, new quotas apply immediately. Old quota doesn't reset though.

---

## Error Messages & Solutions

### Error 1: RESOURCE_EXHAUSTED (429)
```
❌ You exceeded your current quota
Solution: Wait 24h or upgrade to paid plan
```

### Error 2: UNAUTHENTICATED (401)
```
❌ Invalid API Key
Solution: Check VITE_GEMINI_API_KEY in .env.local
```

### Error 3: PERMISSION_DENIED (403)
```
❌ API not enabled
Solution: Enable Generative AI API in Google Cloud Console
```

### Error 4: NOT_FOUND (404)
```
❌ Model not found
Solution: Check that model name is correct in code
```

---

## Advanced: Checking Quota Details

### View All Quotas

```
Google Cloud Console
> IAM & Admin
> Quotas
> Filter by "generate"
```

### Details You'll See:
- **Metric:** generativelanguage.googleapis.com/generate_content_free_tier_requests
- **Current Usage:** How many requests used today
- **Limit:** 50 (for free tier)
- **Reset Time:** When quota resets

### Get Detailed Breakdown:
```
Click on metric name
> View usage chart
> See trend over days
> Plan better
```

---

## Best Practices

### ✅ DO:
- Use manual uploads for most services
- Plan AI generation in advance
- Monitor your usage regularly
- Upgrade early if you predict high usage
- Keep API key in .env.local (not in code)

### ❌ DON'T:
- Regenerate same image multiple times
- Keep trying after quota error (won't work)
- Share API key publicly
- Hardcode API key in source code
- Generate image for every service immediately

---

## Getting Help

### Check Status
1. [Google AI Status](https://status.cloud.google.com/)
2. [Google Cloud Status](https://status.cloud.google.com/)

### Contact Support
- [Google Cloud Support](https://cloud.google.com/support)
- [Google AI Support](https://support.google.com/ai)

### Read Documentation
- [Gemini API Docs](https://ai.google.dev/gemini-api)
- [Rate Limits Guide](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Quotas Guide](https://cloud.google.com/docs/quotas)

---

## Summary

| Problem | Cause | Fix Time | Cost |
|---------|-------|----------|------|
| Quota Exceeded | Hit free tier limit | 24h | Free (wait) |
| Want Images Now | Don't want to wait | 5m | Free (upload) |
| Generate Often | Need unlimited | 10m | $0-15/mo |

**Next Step:** Choose your strategy and implement it.

