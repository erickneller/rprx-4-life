
## Replace Bot Icon with Custom Financial Advisor Avatar

### Goal
Replace the robot head icon (`Bot` from lucide-react) with your uploaded avatar image - a friendly 3D illustrated financial advisor character with glasses, suit, and financial icons.

---

## Locations to Update

The `Bot` icon is currently used in **4 places** across 2 files:

| File | Location | Description |
|------|----------|-------------|
| `ChatThread.tsx` | Line 33 | Large welcome screen icon (16x16) |
| `ChatThread.tsx` | Line 75 | Empty conversation prompt icon |
| `ChatThread.tsx` | Line 83 | Loading state avatar (while waiting for response) |
| `MessageBubble.tsx` | Line 21 | Avatar next to each assistant message |

---

## Implementation Steps

### Step 1: Copy the avatar image to project
Copy `user-uploads://rprx_chatguy.jpeg` to `src/assets/rprx-chatguy.jpeg`

### Step 2: Create a reusable AssistantAvatar component
Create a new component `src/components/assistant/AssistantAvatar.tsx` that:
- Imports the avatar image
- Accepts a `size` prop ("sm" | "lg") for the two different sizes used
- Uses the Avatar component from UI library for consistent styling

```tsx
import assistantAvatar from '@/assets/rprx-chatguy.jpeg';

interface AssistantAvatarProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export function AssistantAvatar({ size = 'sm', className }: AssistantAvatarProps) {
  const sizeClasses = size === 'lg' ? 'h-16 w-16' : 'h-8 w-8';
  
  return (
    <img 
      src={assistantAvatar} 
      alt="RPRx Strategy Assistant"
      className={cn(sizeClasses, 'rounded-full object-cover shrink-0', className)}
    />
  );
}
```

### Step 3: Update ChatThread.tsx
- Import `AssistantAvatar` component
- Remove `Bot` from lucide imports
- Replace all 3 `Bot` icon usages with `<AssistantAvatar />`
  - Welcome screen: Use `size="lg"` 
  - Empty state and loading: Use `size="sm"` (default)

### Step 4: Update MessageBubble.tsx
- Import `AssistantAvatar` component
- Remove `Bot` from lucide imports  
- Replace `Bot` icon with `<AssistantAvatar />` for assistant messages

---

## Visual Result

| Before | After |
|--------|-------|
| Robot head icon | Friendly financial advisor character |
| Generic tech feel | Professional, approachable personality |

The avatar will appear:
- **Large (64x64px)** on the welcome screen
- **Small (32x32px)** next to each assistant message and in loading states

---

## Files Changed

1. **NEW**: `src/assets/rprx-chatguy.jpeg` - Avatar image
2. **NEW**: `src/components/assistant/AssistantAvatar.tsx` - Reusable avatar component
3. **EDIT**: `src/components/assistant/ChatThread.tsx` - Use AssistantAvatar instead of Bot
4. **EDIT**: `src/components/assistant/MessageBubble.tsx` - Use AssistantAvatar instead of Bot
