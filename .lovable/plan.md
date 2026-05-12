
# /rprx-w2 — W2 Partner Program Landing Page

A fully standalone, public, long-form sales page at `/rprx-w2`. No app chrome, no auth required. Navy + gold + white palette, mobile-first, sticky CTA.

## Files to create

```
src/pages/RprxW2.tsx                       Page shell (sticky nav, sections, footer)
src/components/w2/W2Nav.tsx                Sticky navy/white top nav with anchor links + sticky CTA
src/components/w2/W2Hero.tsx               Pre-headline, headline, subheadline, hero image, CTA block, social proof
src/components/w2/W2Problem.tsx            "Four Horsemen" 4-block grid + gut-punch stats + transition
src/components/w2/W2RootCause.tsx          Side-by-side comparison table (typical W2 vs RPRx member)
src/components/w2/W2Solution.tsx           Program intro + Rick Darvis credibility callout
src/components/w2/W2HowItWorks.tsx         3 numbered steps + "Simple Math" box
src/components/w2/W2Benefits.tsx           10 benefit blocks + Income Broker upgrade tier callout
src/components/w2/W2SocialProof.tsx        5 testimonials + trust badge row
src/components/w2/W2Pricing.tsx            Two pricing cards (monthly secondary, annual featured) + math callout
src/components/w2/W2RiskReversal.tsx       Guarantee section
src/components/w2/W2Faq.tsx                Accordion using shadcn Accordion (7 Qs)
src/components/w2/W2FinalCta.tsx           Closing headline, copy, CTA, trust row
src/components/w2/W2Footer.tsx             Links + disclaimer + copyright
src/lib/w2Config.ts                        CHECKOUT_ANNUAL_URL, CHECKOUT_MONTHLY_URL, MEMBER_LOGIN_URL constants
src/assets/w2-hero.jpg                     Generated split-screen hero image
```

Edit `src/App.tsx` to add `<Route path="/rprx-w2" element={<RprxW2 />} />` above the catch-all.

## Design system

- Scoped to the page via a wrapper `div` with custom CSS vars — does **not** mutate global tokens.
- Palette (HSL, defined inline in the page wrapper):
  - `--w2-navy: 218 55% 14%` (primary surface / nav / headlines)
  - `--w2-navy-soft: 218 40% 22%`
  - `--w2-gold: 42 78% 52%` (CTAs, accents, highlights)
  - `--w2-gold-soft: 42 90% 65%`
  - `--w2-cream: 40 30% 97%` (alt section bg)
  - `--w2-ink: 220 20% 12%` (body text on light)
  - Uses existing semantic tokens for cards/borders where they fit.
- Typography: Tailwind `font-serif` (existing) for big display headlines, default sans for body. Generous tracking on pre-headlines (uppercase, gold).
- Sections alternate white / cream / navy backgrounds for rhythm.
- Buttons: gold solid primary CTA with subtle shadow + hover lift; navy outline secondary.
- Mobile-first: `px-4 sm:px-6 lg:px-8`, max-w `7xl`, stacked grids collapse to single column under `md`.

## Sticky CTA behavior

`W2Nav` uses `useEffect` + scroll listener (or `IntersectionObserver` on the hero) to reveal the "Get My $2,000 Tax Credit →" pill button after the hero scrolls out of view. Smooth-scroll anchor links: `#how`, `#what`, `#pricing`, `#faq`.

## Hero image

Generate one image with `imagegen--generate_image` (standard quality, 1600x900):
> "Split-screen editorial photograph. Left half: a tired W2 office employee at a desk under cool fluorescent light, looking at a paystub with a stressed expression, muted blue tones. Right half: same person at home, relaxed and confident, smiling with family softly out of focus in the background, warm golden afternoon light. Cinematic, photorealistic, shallow depth of field, no text."

Saved to `src/assets/w2-hero.jpg`, imported as ES6 module.

## Checkout wiring

`src/lib/w2Config.ts` exports:
```ts
export const CHECKOUT_ANNUAL_URL = "https://buy.stripe.com/REPLACE_ME_ANNUAL";
export const CHECKOUT_MONTHLY_URL = "https://buy.stripe.com/REPLACE_ME_MONTHLY";
export const MEMBER_LOGIN_URL = "/auth";
```
All CTA buttons (`<a href={...} target="_blank" rel="noopener noreferrer">`) read from this file. After the build the user just swaps the two Stripe URLs in one place.

## Section content

All copy from the user's outline goes in verbatim, with light formatting:
- Four Horsemen blocks: 4-up grid on desktop, stacked on mobile, each with a Lucide icon (Receipt, Landmark, ShieldPlus, GraduationCap), a numeric loss highlight in gold, and the body copy.
- Comparison table: shadcn `Table` styled with navy header.
- Benefits: 10 cards in a 1/2/2 column responsive grid, each with icon + headline + body. Income Broker upgrade tiers rendered as a highlighted callout below.
- Testimonials: 5 cards in a responsive grid with a gold left border and italic quote.
- Pricing: two cards side-by-side (`md:grid-cols-2`), annual card has a "BEST VALUE" gold ribbon and elevated shadow.
- FAQ: shadcn `Accordion` with all 7 Q&As.
- Footer: disclaimer text + privacy/terms/contact/login links.

## SEO

In `RprxW2.tsx` use a small `useEffect` to set:
- `document.title = "RPRx Partner Program for W2 Employees | Get a $2,000 Tax Credit"`
- meta description, canonical, og:title/description/image (created/updated on mount, removed on unmount).
- Single `<h1>` (the hero headline). All sections use `<h2>`. Hero image has descriptive alt text.

## Out of scope

- Real Stripe checkout creation (user will provide URLs).
- Exit-intent popup (mentioned in outline notes but flagged "consider"; can add in a follow-up).
- Explainer video embed (also noted as optional).
- Member auth / dashboard logic — link only.

## Verification

- Visit `/rprx-w2` — all 13 sections render, sticky CTA appears after hero, anchor links scroll smoothly.
- Resize to 375px — no horizontal scroll, all grids stack, hero image scales.
- Click pricing CTAs — open the configured URLs in a new tab.
- Lighthouse-style spot check: single H1, alt text on hero, meta description present.
