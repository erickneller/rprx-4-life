## Update Sidebar Advisor Link

In `src/components/layout/AppSidebar.tsx` (lines ~151-172), update the sidebar Advisor CTA:

- Change label "Speak with an Advisor" → "Speak With A Virtual Advisor" (both tooltip and visible span).
- Replace the external `<a href={resolveAdvisorHref(advisorUrl)} target="_blank">` with a React Router `<NavLink to="/virtual-advisor">` so it routes to the in-app Virtual Advisor page.
- Drop the `advisorUrl` requirement in the visibility condition — show the link whenever `advisorEnabled && isVisible('item:advisor_link')` is true (URL no longer needed since it links internally).
- Keep the `Phone` icon and existing styling.

No other files change. The dashboard CTA card already says the right thing and links correctly.