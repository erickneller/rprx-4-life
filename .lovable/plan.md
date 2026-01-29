

## Add Slow Bounce Animation to Strategy Assistant Avatar

### Overview
Add a gentle floating/bouncing animation to the assistant avatar on the Strategy Assistant start screen to draw attention without being annoying.

---

## Implementation

### File: `src/components/assistant/ChatThread.tsx`

**Line 34 - Add animate-float class to the avatar:**

```tsx
// Before
<AssistantAvatar size="lg" />

// After
<AssistantAvatar size="lg" className="animate-float" />
```

---

## Technical Notes

The `animate-float` animation is already defined in `tailwind.config.ts`:

| Property | Value |
|----------|-------|
| Keyframes | `translateY(0)` → `translateY(-10px)` → `translateY(0)` |
| Duration | 3 seconds |
| Timing | ease-in-out |
| Repeat | infinite |

This creates a slow, subtle up-and-down floating motion that draws attention without being fast or annoying.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/assistant/ChatThread.tsx` | Add `animate-float` class to the large AssistantAvatar on start screen |

