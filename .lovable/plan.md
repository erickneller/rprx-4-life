

## Speed Up Strategy Assistant Responses

### Problem Summary
The chat responses are slow due to:
1. A massive 1,200+ line system prompt containing the full knowledge base (sent with EVERY request)
2. Full conversation history growing with each message
3. Sequential database operations

### Solution Overview
We will implement several optimizations to reduce response time from 5-10 seconds to 1-3 seconds:

---

## Changes Required

### 1. Reduce System Prompt Size (Biggest Impact)

**File**: `supabase/functions/rprx-chat/index.ts`

Split the knowledge base from the system prompt and only include relevant strategies when needed:

- Create a condensed system prompt with instructions only (remove the full 80-strategy knowledge base)
- Store strategy summaries in a separate searchable format
- Only inject relevant strategies based on conversation context

```text
Before: System prompt = ~15,000+ tokens
After: System prompt = ~500-800 tokens + relevant strategies only
```

### 2. Limit Conversation History

**File**: `supabase/functions/rprx-chat/index.ts`

Only send the last 10-20 messages instead of the entire history:

```typescript
// Before
.order('created_at', { ascending: true });

// After - Only get recent messages
.order('created_at', { ascending: false })
.limit(20)
// Then reverse the order
```

### 3. Parallelize Database Operations

**File**: `supabase/functions/rprx-chat/index.ts`

Run independent database operations in parallel:

```typescript
// Before: Sequential
await saveUserMessage();
const messages = await fetchMessages();

// After: Parallel where possible
const [_, messages] = await Promise.all([
  saveUserMessage(),
  fetchMessages()
]);
```

### 4. Use a Smaller/Faster Model for Simple Responses

**File**: `supabase/functions/rprx-chat/index.ts`

The code already uses `gpt-4o-mini` which is good, but we can add:
- Lower `max_tokens` for simpler questions
- Consider using a tiered approach (fast model for simple chats, full model for strategy recommendations)

---

## Implementation Details

### Phase 1: Quick Wins (Immediate Impact)

1. **Limit conversation history to last 20 messages**
   - Edit lines 1363-1368 to add `.limit(20)` and reverse ordering

2. **Reduce max_tokens from 2000 to 1500** for most responses
   - Edit line 1422

3. **Parallelize save + fetch operations**
   - Refactor lines 1346-1377

### Phase 2: Major Optimization

4. **Restructure the knowledge base**
   - Extract the 80 strategies into a structured array
   - Create a condensed system prompt with just the persona/instructions
   - Only inject 5-10 relevant strategies based on keywords in user message
   - This alone can reduce token usage by 80%+

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| System prompt tokens | ~15,000 | ~800-1,500 |
| Messages sent | All history | Last 20 |
| DB operations | Sequential | Parallel |
| Typical response time | 5-10 seconds | 1-3 seconds |

---

## Files to Modify

1. **EDIT**: `supabase/functions/rprx-chat/index.ts`
   - Restructure knowledge base lookup
   - Add conversation history limit
   - Parallelize database operations
   - Optimize token usage

