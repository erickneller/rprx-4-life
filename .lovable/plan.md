

## Make the App Mobile-Friendly (No Horizontal Scrolling)

### Problem
Several areas of the app cause horizontal scrolling on small screens:

1. **`App.css` boilerplate**: The `#root` rule adds `padding: 2rem` and `max-width: 1280px` globally -- a leftover from the Vite starter template that conflicts with the full-width sidebar layout.

2. **Debt Dashboard stats grid**: Uses `grid-cols-2 md:grid-cols-4`, which is fine, but the header row uses `flex items-center justify-between` which can overflow when the "Add Debt" button text plus the title are too wide on small screens.

3. **Debt Dashboard header ("Your Debt Freedom Journey")**: The title + button row doesn't wrap on narrow screens.

4. **FocusDebtCard header row**: The debt name, type label, and edit/delete buttons sit in a single row that can overflow.

5. **CashFlowStatusCard**: The horizontal layout (`flex items-center justify-between`) doesn't stack on mobile, so the "Update in Profile" / "Go to Profile" button can push content off-screen.

6. **Global overflow**: No `overflow-x: hidden` on `html` or `body` as a safety net.

### Changes

**1. Remove `App.css` boilerplate (or gut the `#root` rule)**
- The `#root { max-width: 1280px; padding: 2rem; }` rule adds unnecessary padding and constrains the layout. Remove the entire file or clear the `#root` rule so the sidebar + main layout can use the full viewport width.

**2. Add global overflow-x safety in `index.css`**
- Add `overflow-x: hidden` to the `body` rule to prevent any accidental horizontal scroll.

**3. Make DebtDashboard header responsive**
- Stack the title and "Add Debt" button vertically on small screens using `flex-col sm:flex-row`.

**4. Make FocusDebtCard header responsive**
- Allow the debt name + type label + action buttons row to wrap on small screens.

**5. Make CashFlowStatusCard responsive**
- Stack the icon/text and button vertically on mobile using `flex-col sm:flex-row`.
- Same treatment for the "missing cash flow" variant.

**6. Make DebtDashboard stats grid mobile-friendly**
- The current `grid-cols-2` is fine, but ensure the text inside each stat card doesn't overflow by allowing text truncation.

---

### Technical Details

| File | Change |
|------|--------|
| `src/App.css` | Remove or empty the `#root` rule (remove padding/max-width) |
| `src/index.css` | Add `overflow-x: hidden` to `body` base styles |
| `src/components/debt-eliminator/dashboard/DebtDashboard.tsx` | Change header `div` from `flex items-center justify-between` to `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4` |
| `src/components/debt-eliminator/dashboard/FocusDebtCard.tsx` | Wrap the debt name/type/buttons row to allow stacking: `flex flex-wrap items-center justify-between gap-2` |
| `src/components/debt-eliminator/dashboard/CashFlowStatusCard.tsx` | Change both layout variants from horizontal-only flex to `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4` |

