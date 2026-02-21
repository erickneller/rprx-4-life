
# Add Delete Profile Picture Button

## Overview
Add a delete/remove button to the Profile Photo card that appears only when the user has an existing avatar. Clicking it clears the `avatar_url` from the profile and removes the file from Supabase Storage.

## Changes

### 1. `src/hooks/useProfile.ts`
- Add a `deleteAvatar` async function:
  - Extracts the file path from the current `avatar_url`
  - Calls `supabase.storage.from('avatars').remove([filePath])` to delete the file
  - Updates the profile with `avatar_url: null`
  - Invalidates the profile query cache
- Export `deleteAvatar` from the hook

### 2. `src/pages/Profile.tsx`
- Import `Trash2` icon from lucide-react
- Destructure `deleteAvatar` from `useProfile()`
- Add a `handleDeleteAvatar` function that:
  - Calls `deleteAvatar()`
  - Clears the local `previewUrl` state
  - Shows a success toast
  - Handles errors with a destructive toast
- In the Profile Photo card, add a "Remove Photo" button below the avatar (next to the helper text) that:
  - Only renders when `displayUrl` exists (user has an avatar)
  - Shows a Trash2 icon with "Remove Photo" text
  - Uses `variant="ghost"` with destructive text styling
  - Is disabled while uploading or deleting

### Visual Layout
```text
    [Avatar with camera button]
    "Click the camera icon to upload a photo"
    [Trash2 icon] Remove Photo    <-- new, only when avatar exists
```

No database or storage bucket changes needed -- the existing `avatars` bucket and RLS policies already support delete operations.
