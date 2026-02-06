

# Profile Page Migration Plan

## Overview
Convert the profile edit modal into a dedicated full-page experience with proper navigation. This improves scrollability and provides a better UX for the growing amount of profile data.

---

## Changes Summary

| Component | Current | After |
|-----------|---------|-------|
| Profile UI | Modal popup (ProfileEditModal) | Full page (/profile) |
| Navigation | Avatar dropdown → "Edit Profile" opens modal | Avatar dropdown → "Edit Profile" navigates to /profile |
| Sidebar | No profile link | Add "Profile" link with User icon |

---

## File Changes

### 1. Create New Profile Page
**New file: `src/pages/Profile.tsx`**

- Uses `AuthenticatedLayout` with title "Profile"
- Contains the same form content from ProfileEditModal but in a full-page layout
- Organized into card sections for better visual hierarchy:
  - Profile Photo card
  - Personal Information card
  - Cash Flow Snapshot card
- Save button at bottom (sticky on mobile for convenience)
- Cancel navigates back to previous page

### 2. Update App Routes
**Edit: `src/App.tsx`**

Add new protected route:
```typescript
<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
```

### 3. Update Sidebar Navigation
**Edit: `src/components/layout/AppSidebar.tsx`**

Add Profile to nav items:
```typescript
{ title: "Profile", url: "/profile", icon: User }
```

### 4. Update Profile Avatar Dropdown
**Edit: `src/components/profile/ProfileAvatar.tsx`**

- Remove modal state and modal component
- Change "Edit Profile" menu item to navigate to `/profile`
- Simplify component since it no longer manages modal state

### 5. Keep Modal for Optional Use (or Remove)
**Option: Keep `src/components/profile/ProfileEditModal.tsx`**

Keep the modal component in case it's needed elsewhere in the future, but it won't be used by ProfileAvatar anymore. Alternatively, we can delete it if you prefer.

---

## Page Layout Design

```
┌─────────────────────────────────────────────────────────────┐
│ [Sidebar]  │ RPRx Logo / Profile                   [Avatar] │
├────────────┼────────────────────────────────────────────────┤
│ Dashboard  │                                                │
│ Debt Elim. │  ┌─────────────────────────────────────────┐  │
│ Strategy   │  │ Profile Photo                           │  │
│ My Plans   │  │  [Large Avatar with Camera Button]      │  │
│ ─────────  │  │  Click to upload                        │  │
│ Profile    │  └─────────────────────────────────────────┘  │
│            │                                                │
│            │  ┌─────────────────────────────────────────┐  │
│            │  │ Personal Information                    │  │
│            │  │                                         │  │
│            │  │ Full Name: _______________              │  │
│            │  │ Email: user@email.com (disabled)        │  │
│            │  │ Phone: _______________                  │  │
│            │  │ Company: _______________                │  │
│            │  └─────────────────────────────────────────┘  │
│            │                                                │
│            │  ┌─────────────────────────────────────────┐  │
│            │  │ Cash Flow Snapshot (optional)           │  │
│            │  │                                         │  │
│            │  │ Net Monthly Income                      │  │
│            │  │ $ [__________]                          │  │
│            │  │                                         │  │
│            │  │ Monthly Fixed Obligations               │  │
│            │  │ Debt Payments      Housing              │  │
│            │  │ $ [______]         $ [______]           │  │
│            │  │                                         │  │
│            │  │ Insurance                               │  │
│            │  │ $ [__________]                          │  │
│            │  │                                         │  │
│            │  │ Monthly Living Expenses                 │  │
│            │  │ $ [__________]                          │  │
│            │  │                                         │  │
│            │  │ ┌─────────────────────────────────────┐ │  │
│            │  │ │ Monthly Surplus: $1,200   ↑         │ │  │
│            │  │ └─────────────────────────────────────┘ │  │
│            │  └─────────────────────────────────────────┘  │
│            │                                                │
│            │           [Cancel]  [Save Changes]             │
└────────────┴────────────────────────────────────────────────┘
```

---

## Implementation Details

### Profile Page Structure

```typescript
// src/pages/Profile.tsx
export default function Profile() {
  // Same state/hooks as ProfileEditModal
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const navigate = useNavigate();
  
  // Form state for all fields...
  
  return (
    <AuthenticatedLayout title="Profile">
      <div className="container max-w-2xl py-8 space-y-6">
        {/* Profile Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Avatar upload UI */}
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Name, email, phone, company fields */}
          </CardContent>
        </Card>

        {/* Cash Flow Card */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Snapshot</CardTitle>
            <CardDescription>Help us personalize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowSection {...props} />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
```

### Updated ProfileAvatar (simplified)

```typescript
// No more modal state needed
export function ProfileAvatar() {
  const navigate = useNavigate();
  // ...
  
  return (
    <DropdownMenu>
      {/* ... */}
      <DropdownMenuItem onClick={() => navigate('/profile')}>
        <Settings className="mr-2 h-4 w-4" />
        Edit Profile
      </DropdownMenuItem>
      {/* ... */}
    </DropdownMenu>
  );
}
```

---

## Benefits

| Benefit | Description |
|---------|-------------|
| Better scrolling | Full page allows natural scroll without modal constraints |
| More space | Room for future profile fields without cramping |
| Consistent nav | Profile accessible from sidebar like other features |
| Cleaner code | ProfileAvatar simplified without modal management |

---

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/Profile.tsx` | Create (new page) |
| `src/App.tsx` | Edit (add route) |
| `src/components/layout/AppSidebar.tsx` | Edit (add nav item) |
| `src/components/profile/ProfileAvatar.tsx` | Edit (remove modal, add navigation) |

