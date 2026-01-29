

## Make Delete Icon Always Visible

### Problem
The delete trash icon on conversation items is hidden by default (`opacity-0`) and only appears on hover. This makes it impossible to find if you don't know to hover over items.

---

## Solution
Make the delete icon always visible but subtle, with increased emphasis on hover.

### File: `src/components/assistant/ConversationItem.tsx`

**Current (line 40):**
```tsx
className="h-6 w-6 opacity-0 group-hover:opacity-100 max-sm:opacity-70 transition-opacity"
```

**Updated:**
```tsx
className="h-6 w-6 opacity-40 hover:opacity-100 transition-opacity"
```

This change:
- Makes the icon always visible at 40% opacity (subtle but findable)
- Increases to 100% opacity when hovering directly on the icon
- Works the same on all screen sizes

---

## Alternative Option
If you prefer to keep the icon hidden but want it more discoverable, we could add a tooltip or make the entire row highlight on hover to indicate interactivity.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/assistant/ConversationItem.tsx` | Update delete button opacity classes |

