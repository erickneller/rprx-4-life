

# Update Assessment Selected States to Green

## Overview
Change the selected state styling on all assessment question types to use the standard green success color, matching the checkbox behavior across the application.

## Current State
- **YesNoQuestion**: Selected buttons use `variant="default"` (dark slate) with `ring-primary`
- **SingleChoiceQuestion**: No visual distinction when selected (only radio indicator)
- **RangeSelectQuestion**: Selected uses `border-primary bg-primary/5` (blue tint)
- **SliderQuestion**: Selected label uses `text-primary` (dark)

## Target State
All selected states should use the success color:
- Background: `bg-success` (green)
- Text: `text-success-foreground` (white)
- Border: `border-success`
- Ring: `ring-success`

## Files to Modify

### 1. YesNoQuestion.tsx
Change the selected button styling from default variant to green:
- Replace `variant={value === 'yes' ? 'default' : 'outline'}` with custom classes
- When selected: `bg-success text-success-foreground border-success`
- Change ring from `ring-primary` to `ring-success`

### 2. SingleChoiceQuestion.tsx
Add selected state styling to the option containers:
- When selected: `border-success bg-success/10`
- Unselected: `border-border` (current behavior)

### 3. RangeSelectQuestion.tsx
Change selected state from primary to success colors:
- Replace `border-primary bg-primary/5` with `border-success bg-success/10`

### 4. SliderQuestion.tsx (Optional)
Change selected label color:
- Replace `text-primary` with `text-success`

## Visual Result
When a user makes a selection:
- Yes/No buttons will turn green with white text
- Radio options will have a green border with light green background
- Slider labels will show green for the selected value

## Technical Notes
- Uses existing CSS variables: `--success: 160 84% 39%` and `--success-foreground: 0 0% 100%`
- Consistent with checkbox styling: `data-[state=checked]:bg-success`
- No new dependencies required

