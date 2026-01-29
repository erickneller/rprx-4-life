

## Speed Up Strategy Assistant - Phase 2

### Problem Analysis

Looking at the logs and code, I found the main bottleneck:

| Issue | Impact |
|-------|--------|
| 15 full strategies always injected | ~8,000+ extra tokens per request |
| All strategy fields included | Implementation plans, examples, disclaimers add bulk |
| No intake detection | Strategies injected even for "What's your income?" |
| formatStrategiesForPrompt is verbose | Each strategy = ~300 tokens |

**Current flow**: Every message sends ~10,000+ tokens to OpenAI, even for simple intake questions.

### Solution: Smart Intake Phase Detection

Skip strategy injection during intake phase, only include strategies when the user is ready for recommendations.

---

## Changes Required

### File: `supabase/functions/rprx-chat/index.ts`

#### 1. Add Intake Phase Detection Function (New)

Create a function to detect if we're still in intake phase:

```typescript
function isIntakePhase(messages: Array<{role: string, content: string}>): boolean {
  // If less than 6 exchanges, still in intake
  if (messages.length < 6) return true;
  
  // Check if user has provided key intake info
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
  
  const hasProfileType = /business owner|retiree|salesperson|wage earner|investor|farmer|non-profit/i.test(conversationText);
  const hasIncomeInfo = /\$|income|k|100k|200k|250k|500k|1m/i.test(conversationText);
  const hasGoals = /cash flow|reduce tax|education|retirement|insurance cost/i.test(conversationText);
  
  // If missing key info, still in intake
  return !(hasProfileType && hasIncomeInfo && hasGoals);
}
```

#### 2. Create Slim Strategy Format Function (New)

For recommendations phase, use a condensed format:

```typescript
function formatStrategiesCondensed(strategies: Strategy[]): string {
  if (strategies.length === 0) return "No strategies matched.";
  
  return strategies.map(s => 
    `### ${s.id}: ${s.name}
- Horseman: ${s.horseman.join(', ')}
- Summary: ${s.summary}
- Savings: ${s.savings}
- Best For: ${s.bestFor}`
  ).join('\n\n');
}
```

This is ~60% smaller than the current format (removes implementation plans, examples, disclaimers from initial context).

#### 3. Update Main Handler Logic (~line 1730-1745)

Replace current strategy injection with conditional logic:

```typescript
// Determine if we're in intake phase
const inIntake = isIntakePhase(messages);

let dynamicSystemPrompt: string;

if (inIntake) {
  // Intake phase: No strategy context needed - fast response
  dynamicSystemPrompt = BASE_SYSTEM_PROMPT;
  console.log('Intake phase - skipping strategy context');
} else {
  // Recommendation phase: Include condensed relevant strategies
  const relevantStrategies = findRelevantStrategies(user_message, conversationText);
  const strategiesContext = formatStrategiesCondensed(relevantStrategies);
  console.log(`Recommendation phase - ${relevantStrategies.length} strategies`);
  
  dynamicSystemPrompt = `${BASE_SYSTEM_PROMPT}

## RELEVANT STRATEGIES
${strategiesContext}

When user asks for implementation details, provide full step-by-step plans.`;
}
```

#### 4. Reduce Default Strategy Count (Line 1576)

Change from 15 strategies to 10 for faster recommendations:

```typescript
.slice(0, 10)  // was 15
```

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Intake phase tokens | ~10,000+ | ~800 (prompt only) |
| Recommendation tokens | ~10,000+ | ~3,000 (condensed) |
| Intake response time | 3-5 sec | 1-2 sec |
| Recommendation response time | 5-8 sec | 2-4 sec |

---

## Summary

1. **Add `isIntakePhase()` function** - detects if user is still answering intake questions
2. **Add `formatStrategiesCondensed()` function** - smaller strategy format for recommendations
3. **Conditional strategy injection** - skip strategies during intake, include condensed version for recommendations
4. **Reduce strategy count** - 10 instead of 15 relevant strategies

This will make intake questions respond in 1-2 seconds instead of 3-5+ seconds.

