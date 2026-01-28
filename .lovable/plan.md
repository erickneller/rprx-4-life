

# Change Accent Color from Green to Cobalt Blue

## Overview
Update the accent color throughout the design system from emerald green (#10b981) to Cobalt blue (#155eef). This will change all green buttons, highlights, and accent elements to a professional blue.

## Color Conversion
- **Current**: Emerald Green `#10b981` → HSL `160 84% 39%`
- **New**: Cobalt Blue `#155eef` → HSL `220 90% 51%`

## File Changes

### 1. `src/index.css`
Update all accent-related CSS variables:

**Light Mode (`:root`)**
| Variable | Current | New |
|----------|---------|-----|
| `--accent` | `160 84% 39%` | `220 90% 51%` |
| `--ring` | `160 84% 39%` | `220 90% 51%` |
| `--sidebar-accent` | `160 84% 39%` | `220 90% 51%` |
| `--sidebar-ring` | `160 84% 39%` | `220 90% 51%` |
| `--success` | `160 84% 39%` | Keep as green (success should remain green) |

**Dark Mode (`.dark`)**
| Variable | Current | New |
|----------|---------|-----|
| `--accent` | `160 84% 45%` | `220 90% 60%` (slightly lighter for dark mode) |
| `--ring` | `160 84% 45%` | `220 90% 60%` |
| `--sidebar-ring` | `160 84% 45%` | `220 90% 60%` |

**Gradient Utility**
Update `.gradient-accent` to use blue gradient instead of green.

### 2. Update Comment
Change the design system comment from "Emerald green for growth/wellness/money" to "Cobalt blue for trust/professionalism".

## Visual Impact
All green accent elements will change to Cobalt blue:
- Primary CTA buttons ("Start Free Assessment", "Get Started Free")
- Badge indicators and pills
- Icon highlights
- Focus rings
- Hover states

## Note
The `--success` color will remain green as it semantically represents success states (confirmations, completed actions). Only the accent/brand color changes to Cobalt.

