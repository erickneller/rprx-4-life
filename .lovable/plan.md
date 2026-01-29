

## Center the Avatar on New Conversation Page

### Problem
The assistant avatar on the welcome screen is left-aligned instead of centered. This is because the `<img>` element has `shrink-0` but isn't a block element with auto margins.

### Solution
Add a `flex justify-center` class to the wrapper div around the `AssistantAvatar` component to ensure the avatar is centered horizontally.

---

## Change Required

**File**: `src/components/assistant/ChatThread.tsx`

**Line 33**: Update the wrapper div classes

```tsx
// Before
<div className="mx-auto mb-4">
  <AssistantAvatar size="lg" />
</div>

// After  
<div className="flex justify-center mb-4">
  <AssistantAvatar size="lg" />
</div>
```

---

## Why This Works
- Using `flex justify-center` explicitly centers the child element (the avatar image)
- This approach is more reliable than `mx-auto` for centering non-block elements
- The avatar will now appear horizontally centered above the title text

---

## Files Changed
1. **EDIT**: `src/components/assistant/ChatThread.tsx` - Update line 33 to use flex centering

