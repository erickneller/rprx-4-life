

# RPRx Strategy Assistant - Implementation Plan

## Overview

This plan implements a **Phase 1 AI Chat Experience** for the RPRx Strategy Assistant. The feature allows logged-in users to have AI-assisted conversations about financial strategies, with the AI grounded in the 80-strategy knowledge base covering the Four Horsemen (Interest, Taxes, Insurance, Education).

---

## Architecture Summary

```text
+------------------+       +----------------------+       +------------------+
|   Chat Page UI   | ----> | Supabase Edge Func   | ----> | OpenAI API       |
| (React Frontend) |       | (/rprx-chat)         |       | (GPT-4)          |
+------------------+       +----------------------+       +------------------+
        |                          |
        v                          v
+------------------+       +----------------------+
|  Supabase DB     |       | Knowledge Base       |
|  (conversations, |       | (embedded in system  |
|   messages)      |       |  prompt)             |
+------------------+       +----------------------+
```

---

## Database Schema

### New Tables

**conversations**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Unique conversation ID |
| user_id | uuid (FK) | References auth.users |
| title | text | Auto-generated from first message |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last activity timestamp |

**messages**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Unique message ID |
| conversation_id | uuid (FK) | References conversations |
| role | text | 'user' or 'assistant' |
| content | text | Message content |
| created_at | timestamptz | Message timestamp |

### RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| conversations | User owns | Users can only CRUD their own conversations |
| messages | User owns via conversation | Users can only CRUD messages in their own conversations |

---

## Required Secret

Before implementation, we need to add the **OPENAI_API_KEY** secret:

- **Secret Name**: `OPENAI_API_KEY`
- **Purpose**: Server-side OpenAI API authentication (never exposed to browser)
- **Used By**: Edge function `/rprx-chat`

---

## Edge Function: rprx-chat

### Endpoint Details

- **Path**: `/functions/v1/rprx-chat`
- **Method**: POST
- **Authentication**: Required (JWT validation)

### Request Body

```json
{
  "conversation_id": "uuid | null",
  "user_message": "string"
}
```

### Response

```json
{
  "conversation_id": "uuid",
  "assistant_message": "string"
}
```

### Processing Flow

1. Validate JWT and extract user_id
2. If no conversation_id, create new conversation
3. Save user message to messages table
4. Build conversation history from database
5. Call OpenAI API with system prompt + knowledge base + history
6. Save assistant response to messages table
7. Update conversation updated_at timestamp
8. Return assistant message

---

## Knowledge Base Integration

The 80 strategies from the PDF will be embedded directly in the system prompt as structured data. Each strategy includes:

- Strategy name
- Horseman(s) addressed
- Summary
- Projected savings range
- Complexity (1-5)
- Implementation plan steps
- Key requirements
- Tax code reference (if applicable)
- Example
- Disclaimer

### Strategy Categories

| Horseman | Count | Strategy Range |
|----------|-------|----------------|
| Interest | 10 | Debt payoff, refinancing, HELOC, life insurance loans |
| Taxes | 20 | C-Corp, 401k, HSA, Section 179, Roth conversions |
| Insurance | 20 | HDHP/HSA, captive insurance, long-term care |
| Education | 20 | 529 plans, CLEP/AP, scholarships, tax credits |

---

## System Prompt (Exact)

The edge function will use the exact system instructions provided:

```text
You are an expert RPRx financial strategy assistant.

1. Greet the user and explain you will help them find the best strategies to reduce 
   the impact of the Four Horsemen (Interest, Taxes, Insurance, Education) on their finances.

2. Ask the user the intake questions below, one at a time, and collect their answers.

3. Analyze their responses and select the top 20 most relevant strategies from the 
   knowledge base, prioritizing dollar impact, ease of implementation, and applicability.

4. Present the strategies in a clear, organized list, with summaries and projected savings.

5. Invite the user to select any strategies for which they want a detailed implementation 
   plan, and provide step-by-step instructions for those (using the KB implementation plans).

6. Remind the user that these are sample strategies, not tax or legal advice, and 
   recommend consulting an RPRx advisor for full support. For more help and to speak 
   with a qualified RPRx Advisor, visit: rprx4life.com

7. Always include a disclaimer and offer to answer follow-up questions.

8. Do not create any images while responding. Only create an image if explicitly asked 
   by the user for their own data or strategies.
```

### Intake Questions (Embedded)

The AI will ask these one at a time:

**A. User Profile**
- Which of the following best describes you? (Business Owner, Retiree/Grandparent, Salesperson, Wage Earner, Investor, Farmer, Non-Profit)
- What are your main financial goals? (Increase Cash Flow, Reduce Taxes, Save for Education, Improve Retirement Readiness, Reduce Insurance Costs, Other)

**B. Financial Snapshot**
- Approximate annual household income range
- Total household debt range
- Children/dependents (Y/N, ages)
- Current/planned education expenses
- Biggest financial pain points (open-ended)

**C. Optional**
- Tax return upload option (for future phases)

---

## UI Component Structure

```text
src/
  pages/
    StrategyAssistant.tsx        # Main page container
    
  components/
    assistant/
      ConversationSidebar.tsx    # List of past conversations
      ConversationItem.tsx       # Single conversation preview
      ChatThread.tsx             # Main chat message area
      MessageBubble.tsx          # Individual message display
      ChatInput.tsx              # Message input + send button
      DisclaimerFooter.tsx       # Required disclaimer
      NewConversationButton.tsx  # Start new chat
      
  hooks/
    useConversations.ts          # Fetch user's conversations
    useMessages.ts               # Fetch messages for a conversation
    useSendMessage.ts            # Send message mutation
```

---

## Page Layout

```text
+------------------------------------------------------------------+
| RPRx Strategy Assistant                            [User] [Logout] |
+------------------------------------------------------------------+
|                         |                                          |
| CONVERSATIONS          |           CHAT THREAD                    |
|                        |                                          |
| [+ New Conversation]   |  +----------------------------------+    |
|                        |  | Assistant: Welcome! I'm here to  |    |
| > Today               |  | help you find strategies...       |    |
|   - Debt Strategies   |  +----------------------------------+    |
|   - Tax Planning      |                                          |
|                        |  +----------------------------------+    |
| > Yesterday           |  | You: I'm a business owner...      |    |
|   - Insurance Review  |  +----------------------------------+    |
|                        |                                          |
|                        |                                          |
|                        |  +--------------------------------------+|
|                        |  | Type your message...          [Send] ||
|                        |  +--------------------------------------+|
|                        |                                          |
+------------------------+------------------------------------------+
| Educational information only. Not tax, legal, or financial advice.|
+------------------------------------------------------------------+
```

---

## Strategy Output Format

When presenting top 20 strategies, the AI will format as:

| # | Strategy | Horseman(s) | Savings Range | Complexity | Summary |
|---|----------|-------------|---------------|------------|---------|
| 1 | Equity Recapture | Interest | $50K-$655K | 2 | Use extra payments to dramatically reduce interest... |
| 2 | Maximize 401k | Taxes | $2K-$50K | 1 | Contribute max to reduce taxable income... |

Followed by: "Which of these would you like a step-by-step implementation plan for? Reply with the strategy numbers."

---

## Implementation Plan Format

When user selects strategies:

```text
## Strategy 4: Maximize Retirement Plan Contributions

**Who it's best for:** Anyone with earned income seeking to reduce taxes

**Key Requirements:**
- Earned income
- Eligible retirement plan (401k, SEP, SIMPLE, IRA)

**Step-by-Step Implementation:**
1. Review eligibility for 401(k), SEP, SIMPLE, or IRA plans
2. Contribute up to the annual limit
3. Adjust contributions annually for maximum benefit

**What to bring to your CPA/Advisor:**
- Current retirement account statements
- W-2 or self-employment income documentation
- Prior year tax return

**Disclaimer:** This is not tax or legal advice. Results are not guaranteed. 
For personalized guidance, visit rprx4life.com
```

---

## File Changes Summary

### New Files (12)

| Category | Files |
|----------|-------|
| Edge Function | `supabase/functions/rprx-chat/index.ts` |
| Pages | `src/pages/StrategyAssistant.tsx` |
| Components | `src/components/assistant/ConversationSidebar.tsx`, `ChatThread.tsx`, `MessageBubble.tsx`, `ChatInput.tsx`, `ConversationItem.tsx`, `DisclaimerFooter.tsx`, `NewConversationButton.tsx` |
| Hooks | `src/hooks/useConversations.ts`, `src/hooks/useMessages.ts`, `src/hooks/useSendMessage.ts` |

### Modified Files (2)

| File | Change |
|------|--------|
| `src/App.tsx` | Add route `/strategy-assistant` |
| `supabase/config.toml` | Add edge function configuration |

### Database Migrations (1)

Single migration containing:
- Create `conversations` table
- Create `messages` table
- RLS policies for both tables

---

## Guardrails (Built Into System Prompt)

- Do not provide tax/legal advice
- Do not promise results or guaranteed savings
- Do not invent IRS references or forms not in the KB
- Do not generate images unless explicitly asked
- Always include disclaimer
- Always reference rprx4life.com for professional support

---

## Implementation Phases

| Phase | Description |
|-------|-------------|
| **1** | Add OPENAI_API_KEY secret |
| **2** | Database migration (conversations, messages tables) |
| **3** | Edge function with system prompt and KB |
| **4** | UI components (sidebar, chat thread, input) |
| **5** | Hooks for data fetching and mutations |
| **6** | Route and navigation integration |
| **7** | Testing and refinement |

---

## Technical Notes

### Message Rendering

The chat UI will render AI responses with **Markdown support** using `react-markdown` since the AI will format strategy tables and implementation plans using Markdown.

### Conversation Title Generation

When a new conversation starts, the title will be auto-generated from the first user message (first 50 characters + "...").

### Mobile Responsive

- Sidebar collapses to drawer on mobile
- Chat input fixed to bottom
- Touch-friendly message bubbles

### Rate Limiting

OpenAI API calls are naturally rate-limited by the edge function's response time. Future phases may add explicit rate limiting.

---

## Security Considerations

- OpenAI API key stored as Supabase secret (never in browser)
- JWT validation on every edge function call
- RLS policies ensure users only see their own data
- No raw SQL execution in edge function

