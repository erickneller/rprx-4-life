
# Password Reset Flow Implementation

## Overview
Add a complete password reset flow that allows users to request a password reset email and set a new password. This integrates with Supabase's built-in password recovery system.

## User Flow
1. User clicks "Forgot password?" link on login form
2. User enters their email address
3. Supabase sends a password reset email with a secure link
4. User clicks the link and is redirected to the app with a recovery token
5. User enters and confirms their new password
6. Password is updated and user is signed in

## What Will Be Built

### 1. Updated Auth Page (`/auth`)
- Add "Forgot password?" link below the login form
- Add a "forgot password" view state that shows email-only form
- Success message after sending reset email
- Back link to return to login

### 2. Reset Password Page (`/reset-password`)
A new page that:
- Detects the recovery token from the URL (handled automatically by Supabase)
- Shows a form to enter new password with confirmation
- Validates password match and minimum length
- Updates password and redirects to home on success

### 3. Updated Auth Hook
Add two new functions:
- `resetPasswordForEmail`: Sends the password reset email
- `updatePassword`: Sets the new password after recovery

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useAuth.tsx` | Modify | Add `resetPasswordForEmail` and `updatePassword` functions |
| `src/pages/Auth.tsx` | Modify | Add forgot password link and email-only reset request form |
| `src/pages/ResetPassword.tsx` | Create | New password entry form for completing the reset |
| `src/App.tsx` | Modify | Add `/reset-password` route |

## Technical Details

### Password Reset Request
Uses `supabase.auth.resetPasswordForEmail()` with a redirect URL pointing to `/reset-password`:
```typescript
const resetPasswordForEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error };
};
```

### Password Update
Uses `supabase.auth.updateUser()` to set the new password:
```typescript
const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
};
```

### Validation
- Email validation on reset request form
- Password minimum 6 characters on new password form
- Password confirmation must match
- Clear error messages for all failure cases

### Auth State Handling
When user clicks the reset link:
1. Supabase automatically handles the token exchange
2. The `onAuthStateChange` listener detects the `PASSWORD_RECOVERY` event
3. User is in a special session state that allows password update
4. After update, user is fully authenticated
