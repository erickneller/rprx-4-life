

## Fix: Feedback button no longer opens popover

### Root cause
In `src/components/feedback/PageFeedbackWidget.tsx`, `PopoverTrigger asChild` wraps `TooltipProvider` → `Tooltip` → `TooltipTrigger asChild` → `Button`. Radix `asChild` requires a single child that forwards refs and props to a DOM node. `TooltipProvider` is a context provider — it doesn't forward props/ref to the button, so the popover's click handler never lands on the trigger. Result: clicking does nothing.

This regressed when the tooltip was added around the trigger in the previous edit.

### Fix (1 file)

**`src/components/feedback/PageFeedbackWidget.tsx`** — restructure so both `PopoverTrigger` and `TooltipTrigger` wrap the same `Button` correctly:

- Move `TooltipProvider` to the outer level (outside `Popover`), since it only supplies context.
- Nest `TooltipTrigger asChild` **inside** `PopoverTrigger asChild`, with the `Button` as the single innermost child. Radix supports double-`asChild` nesting because both triggers merge their props onto the same underlying element.

Resulting structure:
```
<TooltipProvider>
  <Popover>
    <Tooltip>
      <PopoverTrigger asChild>
        <TooltipTrigger asChild>
          <Button … />
        </TooltipTrigger>
      </PopoverTrigger>
      <TooltipContent>…</TooltipContent>
    </Tooltip>
    <PopoverContent>…</PopoverContent>
  </Popover>
</TooltipProvider>
```

No other logic, styling, or hooks change.

### Verification
- Click the blue feedback bubble → popover opens with stars, textarea, Submit button.
- Hover (without clicking) → tooltip "Click to submit page specific feedback" still appears.
- Submit a rating → toast confirms and popover closes.

### Files touched
- `src/components/feedback/PageFeedbackWidget.tsx`

### Out of scope
- No DB, hook, or styling changes.

