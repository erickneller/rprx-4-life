## Add editable button label per partner

**Database**
- Add `button_label TEXT` column to `partners` table (nullable).

**Admin (`src/components/admin/PartnersTab.tsx`)**
- Add "Button Label" input to the Edit Partner form (placed after Partner URL).
- Placeholder: `Visit Trusted Resource`.
- Save the value to `partners.button_label` (empty string → null).

**Public page (`src/pages/Partners.tsx`)**
- Render `partner.button_label || "Visit Trusted Resource"` on the blue CTA.

**Hook (`src/hooks/usePartners.ts`)**
- Include `button_label` in the select/types so it flows through to UI.

No other components affected. Existing partners without a value will continue to show "Visit Trusted Resource".