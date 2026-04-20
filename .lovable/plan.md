

## Add Visible Loading Indicator While Strategy Assistant Responds

**Current state:** While `isSending` is true, the chat shows a tiny `Loader2` spinner inside a small grey message bubble next to the assistant avatar. It's easy to miss, especially in auto-mode where strategy generation can take 10–30 seconds.

### Fix (1 file: `src/components/assistant/ChatThread.tsx`)

Replace the minimal spinner block with a more prominent, friendly "thinking" indicator:

**Visual design:**
- Full-width centered card (matches existing `max-w-3xl mx-auto` thread layout)
- Animated `AssistantAvatar` with the existing `animate-float` bounce
- Large spinning `Loader2` icon (h-6 w-6) in the brand accent color
- Status text that rotates through coach-tone messages every ~2 seconds:
  - "Analyzing your profile…"
  - "Reviewing your Four Horsemen…"
  - "Crafting personalized strategies…"
  - "Almost there…"
- Subtle pulsing background using existing `animate-pulse` on the bubble
- Three animated dots (`.` `.` `.`) using staggered `animate-bounce` for a chat-typing feel

**Auto-mode enhancement:**
When `autoMode === true` and we're waiting on the first or second response, show a slightly different message set tuned to that flow:
- "Building your strategy overview…"
- "Generating step-by-step plans…"
- "Finalizing implementation details…"

**Implementation notes:**
- Add a small internal `useEffect` + `useState` to cycle the status message while `isSending` is true; reset on completion.
- Use existing Tailwind animations (`animate-float`, `animate-pulse`, `animate-bounce`, `animate-spin`) — no new keyframes needed.
- Keep auto-scroll behavior intact (the indicator sits where the old spinner was, just before the `scrollRef` div).
- No layout shift: the indicator replaces the existing tiny bubble in-place.

### Files touched
- `src/components/assistant/ChatThread.tsx` (replace the existing `{isSending && (...)}` block)

### Out of scope
- No changes to message API, hooks, or response handling.
- No new dependencies.

