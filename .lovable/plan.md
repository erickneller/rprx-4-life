

# Add Full Name and Phone to Signup + Google OAuth Interstitial

## Overview

Add two required fields (Full Name, Phone) to the email signup form, and handle the Google OAuth case where phone is missing with an interstitial screen. No database changes needed -- `profiles.full_name` and `profiles.phone` columns already exist.

## Changes

### 1. Update Auth.tsx -- Add fields to the signup tab

Add two new state variables: `fullName` and `phone`.

Add a phone formatting helper that auto-formats input as `(555) 555-5555` while the user types.

Update the `authSchema` to a `signupSchema` variant that adds:
- `fullName`: string, min 2 chars, regex to reject digits
- `phone`: string, matches US phone pattern `(XXX) XXX-XXXX`

Add the two new fields to the Sign Up tab content, ordered: Full Name, Phone, Email, Password, Create Account button. The Login tab stays unchanged.

After successful `signUp()`, immediately update the profile with `full_name` and `phone`:

```text
1. Call signUp(email, password)
2. If success, call supabase.from('profiles').update({ full_name, phone }).eq('id', newUser.id)
3. If profile update fails, show error -- don't clear the form
```

Since `useProfile` auto-creates the profile row on first query, and `signUp` returns the user object, we can update right after signup. However, Supabase email confirmation may be enabled -- if so, the user won't have a session yet. To handle this:
- After `signUp`, use `supabase.auth.getUser()` or check if the returned `data.user` exists
- If the user ID is available (even pre-confirmation), upsert `full_name` and `phone` into profiles
- If not (email confirmation required), store `full_name` and `phone` in `signUp`'s `options.data` metadata, then write them to profiles on first login via the Google OAuth interstitial logic (or a similar check)

Simpler approach: Use Supabase's `signUp` metadata option to store full_name and phone in `auth.users.raw_user_meta_data`, then when `useProfile` creates the profile row (on first fetch after email confirmation), pull those values from `user.user_metadata` and include them in the insert.

### 2. Update useProfile.ts -- Populate profile from user metadata on creation

In the `useProfile` hook where it creates a new profile (lines 86-95), pull `full_name` and `phone` from `user.user_metadata`:

```text
const metadata = user.user_metadata || {};
const profileData = {
  id: user.id,
  full_name: metadata.full_name || metadata.name || null,
  phone: metadata.phone || null,
};
// Insert with these values instead of bare { id: user.id }
```

This handles both email signup (where we stored them in metadata) and Google OAuth (where Google provides `name` / `full_name` automatically).

### 3. Update useAuth.ts -- Pass metadata in signUp

Modify the `signUp` function to accept `fullName` and `phone` parameters and include them in `options.data`:

```text
const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: { full_name: fullName, phone },
    },
  });
  return { error };
};
```

### 4. Create PhoneInterstitial component + route

New file: `src/pages/CompletePhone.tsx`

A simple single-field screen:
- Heading: "One more thing..."
- Subtext: "We need your phone number to complete your profile"
- Phone input with auto-formatting (same helper as signup)
- "Continue" button that writes phone to profiles and navigates to `/`
- Cannot be skipped (no skip link, no other navigation)

### 5. Add route in App.tsx

Add `/complete-phone` as a protected route:
```text
<Route path="/complete-phone" element={<ProtectedRoute><CompletePhone /></ProtectedRoute>} />
```

### 6. Update Index.tsx -- Check for missing phone after Google OAuth

In `Index.tsx`, after confirming user is authenticated and profile is loaded, add a check:
- If `profile.phone` is null or empty, redirect to `/complete-phone` instead of `/profile` or `/dashboard`
- This catches Google OAuth users who have `full_name` (from Google metadata) but no phone

### 7. Phone formatting helper

Create `src/lib/phoneFormat.ts` with:
- `formatPhone(value: string): string` -- strips non-digits, formats as `(XXX) XXX-XXXX`
- `isValidUSPhone(value: string): boolean` -- checks for 10 digits after stripping formatting

Used by both the signup form and the phone interstitial.

## File Summary

| File | Action |
|------|--------|
| `src/lib/phoneFormat.ts` | New -- phone formatting utility |
| `src/hooks/useAuth.ts` | Edit -- add fullName/phone params to signUp |
| `src/hooks/useProfile.ts` | Edit -- populate full_name/phone from user metadata on profile creation |
| `src/pages/Auth.tsx` | Edit -- add Full Name + Phone fields to signup tab |
| `src/pages/CompletePhone.tsx` | New -- phone interstitial for Google OAuth users |
| `src/App.tsx` | Edit -- add /complete-phone route |
| `src/pages/Index.tsx` | Edit -- redirect to /complete-phone if phone is missing |

## Key Decisions

- **Metadata approach**: Store full_name and phone in `auth.users.raw_user_meta_data` during signup, then pull them when the profile row is first created. This avoids timing issues with email confirmation.
- **Google OAuth**: Google provides `name` in metadata automatically. Phone is never provided by Google, so the interstitial is always shown for new Google users.
- **No database migration needed**: Both columns already exist in the profiles table.
