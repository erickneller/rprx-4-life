## Fix Equity Recapture Calculator title visibility in dark mode

**Problem:** The page header in `src/components/calculators/EquityRecapture/Calculator.tsx` uses hardcoded `text-slate-900` (near-black) for the H1 and `text-slate-600` for the subtitle. In dark mode these are nearly invisible against the dark background.

**Fix:** Replace with semantic design tokens used by the rest of the app:
- H1: `text-slate-900` → `text-foreground`
- Subtitle: `text-slate-600` → `text-muted-foreground`

That's it — one small edit, lines 108 and 111. No other behavior or layout changes.