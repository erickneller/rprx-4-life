

# Update PageHelpButton Styling — Amber Glow Effect

## Overview
Restyle the floating help button to be more noticeable with an amber color, pulsing glow animation on first visit, and localStorage-based glow persistence per page.

## Changes

### 1. `src/index.css` — Add glow keyframes
Add the `helpGlow` keyframe animation in the `@layer utilities` section:
```css
@keyframes helpGlow {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(251, 191, 36, 0.4); }
  50% { box-shadow: 0 0 20px 6px rgba(251, 191, 36, 0.6); }
}
```

### 2. `src/components/help/PageHelpButton.tsx`
- Add localStorage helpers for `help_clicked_pages` (separate from existing `help_hints_dismissed`)
- Track whether the current page has been clicked before using state initialized from localStorage
- On drawer open, mark the page as clicked in localStorage and stop the glow
- Update the `Button` styling:
  - Size: `h-[52px] w-[52px]` (up from h-12 w-12)
  - Color: `bg-amber-400 hover:bg-amber-500 text-white border-none`
  - Shadow: `shadow-lg`
  - Hover: `hover:scale-105 transition-transform`
  - Glow: conditionally apply `animate-[helpGlow_2s_ease-in-out_infinite]` only when the page hasn't been clicked yet
  - Icon: `text-white` (remove `text-primary`)

No other files are affected.

