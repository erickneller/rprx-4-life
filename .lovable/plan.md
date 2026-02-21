
# Scroll-to Support for Onboarding Card

## What Changes

### 1. `src/components/onboarding/OnboardingCard.tsx`
Add `scroll_to` handling in `handleAction` (around line 49-56):
```typescript
if (todayContent.action_type === 'scroll_to' && todayContent.action_target) {
  document.getElementById(todayContent.action_target)?.scrollIntoView({ behavior: 'smooth' });
}
```

### 2. `src/components/money-leak/MoneyLeakCard.tsx`
Add `id="money-leak-card"` to both `<Card>` elements (teaser state at line 64 and full state at line ~95).

### 3. Admin field syntax
Once deployed, you edit Day 1 in the admin panel:
- **Action Target**: `money-leak-card` (just the element ID, no slash or hash)
- **Action Type**: You'll need to type `scroll_to` in the action type. However, the current admin UI uses a dropdown for content_type but the action_type/action_target are plain text inputs, so you can type it directly.

For any future day, you'd use the same pattern: set action_type to `scroll_to` and action_target to whatever element ID you want to scroll to.

### Database update for Day 1
A migration will update Day 1 universal content: `action_type = 'scroll_to'`, `action_target = 'money-leak-card'`.
