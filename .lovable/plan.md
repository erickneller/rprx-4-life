
## Add Suggested Prompt for Strategy Assistant

### Overview
Add a "Next Steps" section to the assessment results page that provides a personalized prompt the user can copy and paste into the Strategy Assistant. The prompt will be dynamically generated based on their primary pressure area (horseman) and cash flow status.

---

## Implementation Approach

### New Component: SuggestedPromptCard
A card component that displays:
- A heading like "Get Personalized Guidance"
- The generated prompt text in a readable format
- A "Copy to Clipboard" button
- A "Go to Strategy Assistant" button that navigates to `/strategy-assistant`

### Prompt Generation Logic
Create a utility function that combines:
- **Primary Horseman**: Interest, Taxes, Insurance, or Education
- **Cash Flow Status**: Surplus, Tight, or Deficit (optional)

Example generated prompts:
- Interest + Deficit: *"My biggest financial pressure is debt and interest costs, and I'm currently spending more than I earn. What are some strategies to address this?"*
- Taxes + Surplus: *"I'd like to improve my tax efficiency. I have a healthy cash flow surplus. What approaches should I consider?"*

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/results/SuggestedPromptCard.tsx` | Card with generated prompt and copy button |
| `src/lib/promptGenerator.ts` | Function to generate prompts based on horseman + cash flow |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/results/ResultsPage.tsx` | Add SuggestedPromptCard section before action buttons |

---

## Technical Details

### promptGenerator.ts
```typescript
export function generateStrategyPrompt(
  primaryHorseman: HorsemanType,
  cashFlowStatus: CashFlowStatus | null
): string
```

Maps each horseman to a focus phrase and combines with cash flow context.

### SuggestedPromptCard.tsx
- Uses `navigator.clipboard.writeText()` for copy functionality
- Shows toast notification on successful copy
- Includes navigation button to Strategy Assistant

---

## User Experience

1. User completes assessment and views results
2. Below the diagnostic feedback, sees "Next Steps" section
3. Card displays a personalized prompt based on their results
4. User clicks "Copy Prompt" -> prompt copied, toast confirms
5. User clicks "Start Chat" -> navigates to Strategy Assistant
6. User pastes prompt to begin personalized conversation

---

## Future Expansion Points
The prompt generator is designed to easily incorporate:
- Profile data (name, company)
- Additional assessment responses
- More detailed horseman-specific questions
