

## Add User Profiles Feature

### Overview
Add user profiles with avatar, name, and standard SaaS profile info. A profile avatar will appear in the top right header, opening a dropdown menu to edit profile details.

---

## Step-by-Step Approach

### Step 1: Database Setup
Create a `profiles` table to store user profile data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, matches auth.users id |
| full_name | text | User's display name |
| avatar_url | text | URL to profile picture |
| phone | text | Optional phone number |
| company | text | Optional company name |
| created_at | timestamp | Auto-set |
| updated_at | timestamp | Auto-updated |

Plus RLS policies so users can only read/update their own profile.

---

### Step 2: Storage Bucket
Create an `avatars` storage bucket for profile picture uploads with public access.

---

### Step 3: New Components

**ProfileAvatar** - Clickable avatar in header that opens dropdown
- Shows user's avatar image or initials fallback
- Dropdown menu with: "Edit Profile", "Sign Out"

**ProfileEditModal** - Dialog for editing profile
- Avatar upload with preview
- Name, phone, company fields
- Save/Cancel buttons

---

### Step 4: New Hook

**useProfile** - React Query hook for profile data
- Fetch current user's profile
- Update profile mutation
- Upload avatar to storage

---

### Step 5: Update Headers
Replace the current email + sign out button pattern with the new ProfileAvatar component in:
- `DashboardHome.tsx`
- `StrategyAssistant.tsx`
- Any other authenticated pages

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/profile/ProfileAvatar.tsx` | Avatar dropdown for header |
| `src/components/profile/ProfileEditModal.tsx` | Edit profile dialog |
| `src/hooks/useProfile.ts` | Profile data hook |

## Files to Modify

| File | Change |
|------|--------|
| `DashboardHome.tsx` | Replace email/signout with ProfileAvatar |
| `StrategyAssistant.tsx` | Replace email/signout with ProfileAvatar |

## Database Changes

| Change | Description |
|--------|-------------|
| Create `profiles` table | Store user profile data |
| Create `avatars` bucket | Store profile pictures |
| Add RLS policies | Secure profile access |

---

## User Experience Flow

1. User logs in -> Profile auto-created (if needed)
2. Click avatar in top-right -> See dropdown menu
3. Click "Edit Profile" -> Modal opens
4. Upload photo, enter name/details -> Save
5. Avatar and name now appear across all pages

