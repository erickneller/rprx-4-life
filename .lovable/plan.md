

# GoHighLevel (GHL) Contact Sync Integration

## Important Note on OAuth vs API Key

You selected OAuth, but GHL OAuth is designed for **marketplace apps** that serve many GHL accounts. Since you're syncing contacts to **your own single GHL location**, a **Location API key** is the correct and simpler approach. OAuth would add unnecessary complexity (token refresh, app registration, marketplace approval) with no benefit for a single-account use case.

## Architecture

```text
┌──────────────┐       profile update        ┌─────────────────────┐
│   RPRx App   │ ──────────────────────────▶  │  Supabase Edge Fn   │
│  (Frontend)  │                              │  "ghl-sync"         │
└──────────────┘                              │  ─ upsert contact   │
                                              │    via GHL API      │
                                              └─────────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────────┐
                                              │   GoHighLevel CRM   │
                                              │   (your location)   │
                                              └─────────────────────┘
                                                        │
                                              GHL webhook on         
                                              contact.update         
                                                        │
                                                        ▼
                                              ┌─────────────────────┐
                                              │  Supabase Edge Fn   │
                                              │  "ghl-webhook"      │
                                              │  ─ update profile   │
                                              └─────────────────────┘
```

## How to Get Your GHL Location API Key

1. Log into your GoHighLevel account
2. Go to **Settings** (gear icon) in your sub-account/location
3. Click **Business Profile** or **Company** in the left sidebar
4. Look for **API Key** section (sometimes under **Settings → Business Profile → API Keys**)
5. Click **Generate** or copy the existing Location API key
6. This key starts with something like `eyJhbGci...` — it's a long JWT-style token

## Implementation Plan

### 1. Store GHL API Key as a Secret
- Add `GHL_API_KEY` as a Supabase edge function secret
- Store your GHL Location ID as `GHL_LOCATION_ID`

### 2. Create `ghl-sync` Edge Function (RPRx → GHL)
- Triggered from the frontend after a successful profile update (name, email, phone)
- Calls GHL API `POST /contacts/upsert` with email as the lookup key
- Stores the returned GHL `contactId` on the profile table (new column: `ghl_contact_id`)
- Prevents sync loops by skipping if the update originated from GHL webhook

### 3. Create `ghl-webhook` Edge Function (GHL → RPRx)
- Public endpoint (no JWT) secured by a shared webhook secret
- Receives `contact.update` events from GHL
- Looks up user by `ghl_contact_id` and updates `full_name`, `phone` in the profiles table
- Sets a flag to prevent the profile update from re-triggering `ghl-sync`

### 4. Add `ghl_contact_id` Column to Profiles
- New nullable text column on `profiles` table to store the GHL contact ID for mapping

### 5. Frontend Integration
- After `updateProfile` succeeds for name/email/phone changes, call `supabase.functions.invoke('ghl-sync')` with the updated fields
- No UI changes needed — sync happens silently in the background

### 6. Register Webhook in GHL
- In GHL Settings → Webhooks, add your edge function URL as the endpoint for `contact.update` events
- The webhook URL will be: `https://wkzgjvnpnhyluxvclymh.supabase.co/functions/v1/ghl-webhook`

## Secrets Needed
- `GHL_API_KEY` — your Location API key from GHL
- `GHL_LOCATION_ID` — your GHL location/sub-account ID
- `GHL_WEBHOOK_SECRET` — a random string you set in both GHL and the edge function for webhook verification

## Files to Create/Modify
- **Create**: `supabase/functions/ghl-sync/index.ts`
- **Create**: `supabase/functions/ghl-webhook/index.ts`
- **Modify**: `supabase/config.toml` (add both functions)
- **Migration**: Add `ghl_contact_id` text column to `profiles`
- **Modify**: `src/hooks/useProfile.ts` (trigger sync after contact field updates)

