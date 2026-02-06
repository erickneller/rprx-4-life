

# Add Conversation Mode Selection to Strategy Assistant

## Overview
When starting a new conversation, give users two clear options:
1. **Profile-Based Strategies** - Get recommendations tailored to their existing profile data (cash flow, goals, family info)
2. **Specific Need** - Discuss a particular financial need or question that may not be captured in their profile

This helps users understand that their profile data is being used and gives them control over the conversation direction.

## Current State
- Single starter button: "Help me choose the best strategies to achieve financial wellness!"
- Profile data is always injected into the AI context
- No choice or transparency about how profile data influences recommendations

## New Experience
Two visually distinct option cards:
- **Option A: "Use My Profile"** - Start with recommendations based on existing profile data
- **Option B: "Ask About Something Specific"** - Free-form question or need not in profile

## Files to Modify

### 1. ChatThread.tsx
Update the empty state (when no conversation selected) to show two option cards instead of a single button:
- Add two clickable cards with icons, titles, and descriptions
- Each card triggers a different initial message
- Keep the general sparkles button as a third subtle option
- Maintain the chat input below for users who want to type directly

## Visual Design

```text
+------------------------------------------+
|            [Avatar Animation]            |
|        RPRx Strategy Assistant           |
|                                          |
|  How would you like to get started?      |
|                                          |
| +------------------+ +------------------+ |
| | [User Icon]      | | [Search Icon]    | |
| | Use My Profile   | | Specific Need    | |
| |                  | |                  | |
| | Get personalized | | Ask about a      | |
| | strategies based | | financial topic  | |
| | on your profile  | | not in your      | |
| | data and goals.  | | profile.         | |
| +------------------+ +------------------+ |
|                                          |
|          Or type your question below     |
|                                          |
+------------------------------------------+
|        [Chat Input Field]                |
+------------------------------------------+
```

## Initial Messages for Each Option

**Option A (Profile-Based):**
```
Based on my current profile and financial goals, what strategies would you recommend to improve my situation?
```

**Option B (Specific Need):**
```
I have a specific financial question or situation I'd like to discuss.
```

## Implementation Details

### Card Component Structure
```typescript
interface StarterOption {
  icon: LucideIcon;
  title: string;
  description: string;
  message: string;
}

const starterOptions: StarterOption[] = [
  {
    icon: User,
    title: "Use My Profile",
    description: "Get personalized strategies based on your profile data and financial goals.",
    message: "Based on my current profile and financial goals, what strategies would you recommend?"
  },
  {
    icon: Search,
    title: "Specific Need",
    description: "Ask about a particular financial topic that may not be in your profile.",
    message: "I have a specific financial question or situation I'd like to discuss."
  }
];
```

### Card Styling
- Use existing Card component from shadcn/ui
- Hover state with subtle border highlight
- Icon in top-left, text below
- Responsive: side-by-side on desktop, stacked on mobile

## User Flow

```text
User opens Strategy Assistant
         |
         v
Empty state with two option cards
         |
    +----+----+
    |         |
    v         v
"Profile"   "Specific"
    |         |
    v         v
AI receives AI receives
message     message
    |         |
    v         v
AI uses     AI asks
profile     "What would
data to     you like to
recommend   discuss?"
```

## Benefits
- Transparency: Users know their profile is being used
- Control: Users can choose their conversation direction
- Encourages profile completion: Profile-based option is more appealing with a filled profile
- Better UX: Clearer starting point than a single generic button

