
# Email/Password Authentication Implementation Plan

## Overview
Add complete email/password authentication to RPRx 4 Life with dedicated auth page supporting both sign up and login flows, plus protected routes.

## What Will Be Built

### 1. Authentication Page (`/auth`)
A new page with:
- Toggle between Login and Sign Up modes
- Email and password input fields with validation
- Clear error messages for common issues (invalid credentials, user already exists, etc.)
- Automatic redirect to home page after successful authentication
- Clean UI matching the existing minimal design

### 2. Authentication Hook
A reusable `useAuth` hook that:
- Manages user session state
- Provides `signIn`, `signUp`, and `signOut` functions
- Uses `onAuthStateChange` for real-time session updates
- Handles email redirect URLs properly for sign up flow

### 3. Protected Routes
- Unauthenticated users visiting `/` will be redirected to `/auth`
- Authenticated users visiting `/auth` will be redirected to `/`
- Logout functionality on the home page

### 4. Updated Home Page
- Shows the authenticated user's email
- Includes a logout button
- Maintains the current minimal design

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useAuth.tsx` | Create | Authentication state management and functions |
| `src/pages/Auth.tsx` | Create | Login/signup page with form handling |
| `src/pages/Index.tsx` | Modify | Add auth check, user display, and logout |
| `src/App.tsx` | Modify | Add `/auth` route |

## Technical Details

### Input Validation
- Email validation using zod schema
- Password minimum length requirement (6 characters for Supabase)
- Proper error handling with user-friendly messages

### Session Management
- Uses `supabase.auth.onAuthStateChange` for reactive session updates
- Stores both user and session objects (not just user)
- Sets up listener before checking existing session (correct initialization order)

### Sign Up Configuration
- Includes `emailRedirectTo` option pointing to the app origin
- Handles "user already registered" error gracefully

## Post-Implementation Note
After implementation, you may want to disable "Confirm email" in your Supabase Authentication settings (Settings > Authentication > Email) to speed up testing. This allows immediate login without email verification.
