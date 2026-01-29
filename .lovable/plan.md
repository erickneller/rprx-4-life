
## Fix Intake Question Formatting

### Problem
The intake questions in the system prompt list options inline in parentheses, causing the AI to output responses like:
```
Which describes you? (Business Owner, Retiree/Grandparent, Salesperson, Wage Earner, Investor, Farmer, Non-Profit)
```

Instead of a properly formatted list that's easier to read and respond to.

### Solution
Update the `BASE_SYSTEM_PROMPT` in `supabase/functions/rprx-chat/index.ts` to:
1. Explicitly instruct the AI to format intake question options as numbered lists
2. Show a clear example of how intake questions should be presented

### Changes Required

**File**: `supabase/functions/rprx-chat/index.ts`

Update lines 1466-1477 from:
```text
## INTAKE QUESTIONS (Ask one at a time)

### User Profile
- Which describes you? (Business Owner, Retiree/Grandparent, Salesperson, Wage Earner, Investor, Farmer, Non-Profit)
- Main financial goals? (Increase Cash Flow, Reduce Taxes, Save for Education, Improve Retirement, Reduce Insurance Costs)

### Financial Snapshot
- Approximate annual household income? (<$100K, $100-250K, $250-500K, $500K-$1M, $1M+)
- Total household debt? (<$50K, $50-200K, $200-500K, $500K+)
- Children or dependents? (If yes, how many and ages?)
- Currently paying for or planning education expenses?
- Biggest financial concerns?
```

To:
```text
## INTAKE QUESTIONS (Ask one at a time)

IMPORTANT: When presenting options, ALWAYS format them as a numbered list on separate lines - NEVER as comma-separated text in parentheses.

Example format:
"Which best describes you?
1. Business Owner
2. Retiree/Grandparent
3. Salesperson
4. Wage Earner
5. Investor
6. Farmer
7. Non-Profit"

Questions to ask:
1. User Profile: Business Owner, Retiree/Grandparent, Salesperson, Wage Earner, Investor, Farmer, Non-Profit
2. Main Goals: Increase Cash Flow, Reduce Taxes, Save for Education, Improve Retirement, Reduce Insurance Costs
3. Annual Income: <$100K, $100-250K, $250-500K, $500K-$1M, $1M+
4. Total Debt: <$50K, $50-200K, $200-500K, $500K+
5. Children/Dependents: How many and ages?
6. Education expenses: Currently paying or planning?
7. Biggest financial concerns?
```

### Expected Result
The AI will output intake questions like:
```
Which best describes you?
1. Business Owner
2. Retiree/Grandparent
3. Salesperson
4. Wage Earner
5. Investor
6. Farmer
7. Non-Profit
```

This makes it easy to read and allows users to respond with just a number.
