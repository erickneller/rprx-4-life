

# Hybrid Chat: Internal KB for Free, OpenAI for Paid

## Concept
Keep the current OpenAI-powered chat for paid users. Add a template-based response engine for free users. Same chat UI for both -- paid users get conversational AI responses, free users get structured responses from the internal knowledge base. Zero additional cost for free tier.

## How It Works

In `supabase/functions/rprx-chat/index.ts`, after building the ranked strategies and user context (all the existing code stays), add a tier check before the OpenAI call:

1. **Check subscription tier** — query `get_subscription_tier()` for the authenticated user
2. **If paid** — proceed with OpenAI call exactly as today (lines 669-748)
3. **If free** — call a new `generateTemplateResponse()` function that builds a markdown response from the already-ranked strategies and profile context

The template response generator handles these intents via keyword matching:
- Strategy recommendations → top 3 ranked strategies with descriptions and impact
- Horseman-specific questions → filtered strategies
- Implementation details → full steps from strategy_definitions
- Profile summary → reflect back their data
- Greetings/fallback → welcome message + top recommendation

## Changes

### File: `supabase/functions/rprx-chat/index.ts`
- Add `detectIntent()` function (~30 lines) for keyword-based intent classification
- Add `generateTemplateResponse()` function (~80 lines) that assembles markdown from ranked strategies
- Add tier check before line 669: query `get_subscription_tier` using the service client
- If free → use template response, skip OpenAI block
- If paid → existing OpenAI flow unchanged

### No other files change
- Chat UI, message storage, conversation flow, auto-strategy generation all remain identical
- `useSubscription` hook already exists on the frontend but the tier gate happens server-side in the edge function

## User Experience
- **Free users**: Instant responses, structured markdown, personalized to their profile and assessment. No API costs.
- **Paid users**: Full conversational AI via GPT-4o-mini, same as today.
- Both tiers use the same chat interface — no visible difference in UI.

## Future Flexibility
- Switching all users to OpenAI later = remove the tier check (one `if` block)
- Switching all users to internal = remove the OpenAI block
- Adding a different AI provider = swap only the fetch call inside the paid branch

