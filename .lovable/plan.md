
## Simplify Plan Detection with Marker Phrase

### Overview
Replace complex heuristic detection with a simple marker phrase approach. The AI assistant will include a specific phrase when delivering implementation plans, and the frontend will only show the "Save Plan" button when that phrase is detected.

---

## Changes Required

### 1. Update Edge Function System Prompt
**File:** `supabase/functions/rprx-chat/index.ts`

Modify the "IMPLEMENTATION PLAN FORMAT" section (around line 1513) to instruct the AI to always begin implementation plan responses with the marker phrase:

```
## IMPLEMENTATION PLAN FORMAT

IMPORTANT: When providing implementation plans, ALWAYS begin your response with this exact phrase:
"Here are the step-by-step implementation plans for each of the selected strategies:"

Then for each selected strategy provide:
- **Title**
- **Who it's best for**
...
```

### 2. Simplify Strategy Parser
**File:** `src/lib/strategyParser.ts`

Replace the complex detection logic with a simple check for the marker phrase:

```typescript
const PLAN_MARKER_PHRASE = "Here are the step-by-step implementation plans";

export function parseStrategyFromMessage(messageContent: string): ParsedStrategy | null {
  // Only show Save Plan button if marker phrase is present
  if (!messageContent.includes(PLAN_MARKER_PHRASE)) {
    return null;
  }
  
  // Rest of parsing logic for extracting steps, strategy IDs, etc.
  ...
}
```

---

## Technical Details

| Change | Purpose |
|--------|---------|
| Add marker phrase instruction to system prompt | Ensures AI consistently uses phrase when delivering plans |
| Check for marker phrase in parser | Reliable detection - no false positives |
| Keep existing step extraction logic | Still extract steps, strategy IDs, etc. for the save modal |

### Marker Phrase Choice
Using "Here are the step-by-step implementation plans" (partial match) allows flexibility while being specific enough to avoid false positives from casual mentions.

---

## Benefits
- **Reliable**: No false positives from simple numbered lists
- **Simple**: One string check instead of multiple heuristics  
- **Controllable**: Can adjust AI behavior via prompt if needed
- **Maintainable**: Easy to understand and modify
