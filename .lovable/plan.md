

## Add Conversation Starter Button

### Goal
Add a clickable suggestion button to the Strategy Assistant's welcome screen for initiating new conversations. When there's no active conversation, users will see a prominent button they can click to quickly send: **"Help me choose the best strategies to achieve financial wellness!"**

For all subsequent messages in that conversation (and any other conversations), users will use the standard chat input to type whatever they want.

---

## How It Works

The `ChatThread` component already has two modes:
1. **No active conversation** (`conversationId === null`): Shows welcome screen with bot icon and description
2. **Active conversation** (`conversationId` exists): Shows chat messages and input

By adding the starter button only to the welcome screen (mode 1), users get a quick-start option for new conversations while retaining full freedom to type anything once a conversation is active.

---

## File Change

**File**: `src/components/assistant/ChatThread.tsx`

### Changes

1. **Add imports** at the top:
   - `Sparkles` from `lucide-react`
   - `Button` from `@/components/ui/button`

2. **Add starter button** in the welcome screen section (the `if (!conversationId)` block, around line 27-43):

```tsx
<Button 
  variant="outline"
  className="mt-4"
  onClick={() => onSendMessage('Help me choose the best strategies to achieve financial wellness!')}
  disabled={isSending}
>
  <Sparkles className="h-4 w-4 mr-2" />
  Help me choose the best strategies to achieve financial wellness!
</Button>
```

This button will be placed after the description paragraph, inside the centered content div.

---

## Visual Result

**Welcome Screen (no conversation):**
- Bot icon
- "RPRx Strategy Assistant" heading
- Description about the Four Horsemen
- **NEW: Starter button with sparkles icon**
- Chat input at the bottom (users can still type their own message instead)

**Active Conversation:**
- Normal chat thread with messages
- Standard chat input - users type freely

---

## User Flow

1. User opens Strategy Assistant → sees welcome screen with starter button
2. User clicks button → sends "Help me choose the best strategies to achieve financial wellness!"
3. New conversation is created and becomes active
4. User continues chatting with any messages they want using the regular input
5. For future new conversations, they'll see the starter button again

