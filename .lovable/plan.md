

# Fix Unsaved Changes Warning for Navigation Links

## Problem
The unsaved changes warning currently only works when clicking the Cancel button, but not when clicking sidebar navigation links. This is because:
- The app uses `BrowserRouter` which doesn't support `useBlocker`
- Sidebar links navigate directly without any interception

## Solution
Create a **Navigation Blocker Context** that allows the Profile page (and future forms) to register when they have unsaved changes, and modify navigation links to check this before navigating.

## Implementation Steps

### 1. Create Navigation Blocker Context
Create a new context (`src/contexts/NavigationBlockerContext.tsx`) that:
- Tracks if any page has unsaved changes
- Stores a callback to show the warning dialog
- Provides functions for pages to register/unregister their dirty state

### 2. Update NavLink Component
Modify `src/components/NavLink.tsx` to:
- Check the navigation blocker context before navigating
- If there are unsaved changes, prevent default navigation and trigger the warning dialog
- Pass the intended destination so navigation can continue after save/discard

### 3. Update Profile Page
Modify `src/pages/Profile.tsx` to:
- Register its dirty state with the navigation blocker context
- Handle navigation continuation after save/discard from any source (Cancel button OR nav links)

### 4. Wrap App with Context Provider
Update `src/App.tsx` to include the `NavigationBlockerProvider`

## Technical Details

```text
User Flow:
+------------------+     +-------------------+     +------------------+
|  Click Nav Link  | --> | Check Dirty State | --> | Show Dialog if   |
|  (e.g. Dashboard)|     | from Context      |     | unsaved changes  |
+------------------+     +-------------------+     +------------------+
                                                          |
                              +---------------------------+
                              |
              +---------------+---------------+---------------+
              |               |               |               |
          [Save]         [Discard]       [Cancel]        
              |               |               |
              v               v               v
        Save & Navigate   Navigate      Stay on page
```

### New Files
- `src/contexts/NavigationBlockerContext.tsx` - Context for tracking dirty state

### Modified Files
- `src/components/NavLink.tsx` - Add navigation interception
- `src/pages/Profile.tsx` - Register with navigation blocker
- `src/App.tsx` - Add context provider
- `src/hooks/useUnsavedChangesWarning.ts` - Support pending navigation destination

## Benefits
- Works with existing `BrowserRouter` (no major refactor needed)
- Reusable for any page with forms (assessments, settings, etc.)
- Centralizes navigation blocking logic
- Handles all navigation sources: Cancel button, sidebar links, back button

