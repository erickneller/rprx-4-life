## Goal
Ensure the RPRx Physical Health Advisor booking link is visible in the downloadable/printed PDF version of the Physical Health Snapshot report.

## Problem
`PhysicalSnapshotReport.tsx` uses `window.print()` to generate the PDF. Both CTA sections render the booking button with `className="... print:hidden"`, so when the user prints/saves as PDF, the booking URL disappears entirely. The "Email Me My Results" and bottom Print buttons are also `print:hidden` (correct), but nothing replaces the booking CTA in print.

## Change (single file: `src/components/health-assessment/PhysicalSnapshotReport.tsx`)

In `CTASection`, add a print-only block that appears wherever the interactive button is hidden:

- Keep the existing `<Button asChild>` link as `print:hidden` (unchanged).
- Add a sibling element shown only in print (`hidden print:block`) containing:
  - Heading: "Book Your RPRx Physical Health Advisor Call"
  - The full booking URL rendered as readable text (e.g. monospace, wrapped) so it's clickable in the PDF and legible if printed on paper.
  - Short instruction line: "Visit the link above to schedule your complimentary call."

Because `CTASection` is rendered twice (top and bottom of the report), the URL will appear twice in the PDF — acceptable and reinforces the CTA.

No changes to logic, data persistence, edge functions, or the admin booking URL setting.

## Out of scope
- No changes to `pdfGenerator.ts` (legacy, not used by the new snapshot report).
- No switch from `window.print()` to jsPDF.
