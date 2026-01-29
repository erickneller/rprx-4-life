

## Auto-Focus Chat Input After Response

### Problem
After sending a message and receiving a response, users have to manually click on the input field to continue typing. This interrupts the conversational flow.

---

## Solution
Add auto-focus behavior to the ChatInput component that triggers:
1. When the component first mounts (page load)
2. After a message is sent
3. When the assistant finishes responding (when `disabled` changes from `true` to `false`)

---

## Changes Required

### File: `src/components/assistant/ChatInput.tsx`

Add a new `useEffect` hook that focuses the textarea:

```typescript
// Auto-focus on mount and when disabled changes to false (response complete)
useEffect(() => {
  if (!disabled && textareaRef.current) {
    textareaRef.current.focus();
  }
}, [disabled]);
```

Also update `handleSubmit` to re-focus after clearing the message:

```typescript
const handleSubmit = () => {
  const trimmed = message.trim();
  if (trimmed && !disabled) {
    onSend(trimmed);
    setMessage('');
    // Focus will be restored by the useEffect when disabled becomes false
  }
};
```

---

## How It Works

| Scenario | Behavior |
|----------|----------|
| Page loads | Input is focused automatically |
| User sends message | Input becomes disabled during response |
| Response completes | `disabled` changes to `false`, triggering focus |
| User clicks starter prompt | Same flow as above |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/assistant/ChatInput.tsx` | Add useEffect to auto-focus when enabled |

