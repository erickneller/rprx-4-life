

# Auto-Generate Top 3 Strategies from Assessment Results

## Overview
Replace the current "copy prompt + Start Chat" card on the Results page with a single "Generate My Strategies" button. When clicked, it automatically builds a rich prompt (hidden from the user) combining profile data and assessment answers, sends it to the Strategy Assistant, and navigates the user to the conversation with the AI's response.

## What Changes

### 1. Rewrite `SuggestedPromptCard` component
- Remove the displayed prompt text, copy button, and "Start Chat" button
- Replace with a single prominent "Generate My Strategies" button
- On click:
  1. Build a detailed hidden prompt using profile data + assessment responses
  2. Call `useSendMessage` to fire the prompt to the `rprx-chat` edge function (creating a new conversation)
  3. Show a loading spinner on the button while waiting
  4. On success, navigate to `/strategy-assistant` with the new conversation ID as a query param or route state
- Show error toast if the call fails

### 2. Enhance the prompt generator (`promptGenerator.ts`)
- Add a new function `generateAutoStrategyPrompt(profile, assessment, responses)` that builds a comprehensive prompt including:
  - Profile type, income, expenses, children, financial goals
  - Assessment scores and primary horseman
  - Cash flow status
  - Summary of assessment answers by category (e.g., "carries credit card balances", "uncomfortable with debt")
  - Explicit instruction: "Based on all of this, recommend the top 3 strategies that are easiest to implement and will produce the fastest results. Rank by ease of implementation. Use the standard strategy output format."
- This prompt is never shown to the user

### 3. Update `StrategyAssistant` page to accept a pre-opened conversation
- Read a `conversationId` from URL search params (e.g., `/strategy-assistant?c=uuid`)
- If present, set it as the `activeConversationId` on mount so the user lands directly in the conversation with the AI's response already loaded

### 4. Fetch assessment responses for the prompt
- The `ResultsPage` already has the assessment data (scores, primary horseman, cash flow status)
- Need to also fetch the individual question responses for the current assessment to include answer context in the prompt
- Add a small query in `SuggestedPromptCard` (or pass from `ResultsPage`) to fetch `assessment_responses` joined with `assessment_questions` for the given assessment ID

## User Flow After Changes

```text
User completes assessment
  -> Sees results (radar chart, primary horseman, etc.)
  -> Scrolls to "Next Steps" section
  -> Clicks "Generate My Strategies"
  -> Button shows loading spinner
  -> Prompt is built silently and sent to AI
  -> User is redirected to Strategy Assistant with conversation open
  -> AI response with top 3 strategies is already displayed
```

## Technical Details

### New function in `src/lib/promptGenerator.ts`

```typescript
export function generateAutoStrategyPrompt(
  profile: Profile,
  assessment: UserAssessment,
  responses: { question_text: string; category: string; value: string }[]
): string
```

The prompt will be structured like:
- "I need my top 3 financial strategies ranked by ease of implementation and speed of results."
- Profile summary (type, income, expenses, cash flow, children, goals)
- Assessment summary (scores per horseman, primary horseman)
- Key assessment insights derived from answers
- "Recommend exactly 3 strategies. Prioritize low complexity and high immediate impact. Use the standard strategy format."

### Modified file: `src/components/results/SuggestedPromptCard.tsx`
- New props: `assessmentId` (to fetch responses), full `profile` and `assessment` objects
- Uses `useSendMessage` hook to send the auto-generated prompt
- Navigates to `/strategy-assistant?c={conversationId}` on success

### Modified file: `src/components/results/ResultsPage.tsx`
- Pass `assessment` object and `assessmentId` to `SuggestedPromptCard`
- Import and pass profile data

### Modified file: `src/pages/StrategyAssistant.tsx`
- On mount, read `c` query param from URL
- If present, set `activeConversationId` to that value

## Files to Modify

| File | Change |
|------|---------|
| `src/lib/promptGenerator.ts` | Add `generateAutoStrategyPrompt()` function |
| `src/components/results/SuggestedPromptCard.tsx` | Replace with single "Generate My Strategies" button + auto-send logic |
| `src/components/results/ResultsPage.tsx` | Pass profile and assessment data to SuggestedPromptCard |
| `src/pages/StrategyAssistant.tsx` | Read conversation ID from URL query param on mount |

