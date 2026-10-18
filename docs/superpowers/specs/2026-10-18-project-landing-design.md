# Project Landing Page (Home / About / Team / Links) — Design

Date: 2026-10-18
Status: Approved for planning
Scope: The shop home tab becomes a project landing page with four sections —
Home, About (system, problem, solution), Team (5 members, names pending), and
Links (pending) — plus a sticky anchor navigation. No routing changes.

## Context

- Hash-routed SPA. `#/shop` (default) renders `src/components/CustomerShop.tsx`;
  its `home` tab renders `src/pages/customer/HomePage.tsx`.
- Today `HomePage` = `<ExperienceLanding />` (centered hero, parallax photo
  mosaic, feature cards) followed by a "Start your flow" section (category
  picker + open-builder card).
- The shop header (`.customer-nav`) is sticky (index.css:965) and contains the
  Forma wordmark, Home/Outfits tabs, cart and login/logout. It is unchanged.
- All styles live in `src/index.css`. Sticky blocks use
  `top: calc(var(--header-height) + var(--space-6))`; `--header-height` is
  `64px` (index.css:196).
- Hackathon context: the landing is the presentation surface for judges — it
  must explain the system, the problem and the solution, name the 5-person
  team, and list project links.

## Decisions

1. The shop home tab content becomes the landing page: sections named Home,
   About, Team, Links, navigated with a sticky anchor bar. The header nav,
   hash routes, and login gate are untouched.
2. Home keeps the existing experience: hero + photo mosaic + feature cards
   (reuse `ExperienceLanding` as-is). The "Start your flow" section is removed.
3. About shows three cards: the system, the problem, the solution. Copy is
   drafted in this spec (below) from the shipped features; editable later.
4. Team shows 5 placeholder member cards. Links shows 3 placeholder link
   cards (GitHub, Live demo, Presentation) in a disabled "coming soon" state.
5. Anchor navigation uses `scrollIntoView` on section refs — no hash changes,
   so the hash router is never disturbed. Smooth scrolling is disabled under
   `prefers-reduced-motion`. No scroll-spy: the active item updates on click.
6. `TEAM` and `LINKS` are module-level arrays in the component file so filling
   real names/URLs later is a one-line edit per entry.

## Components

### `src/components/ProjectLanding.tsx` (new)

Props: `{ onStartBuilder: () => void }`.

Renders, in order:

1. `LandingNav` (local component) — sticky bar below the shop header.
   - `<nav aria-label="Landing sections">` with four buttons: Home, About,
     Team, Links. `aria-current` on the active item; active state set on click.
   - Click → target section `scrollIntoView({ behavior, block: "start" })`;
     `behavior` is `"auto"` when `prefers-reduced-motion: reduce`, else
     `"smooth"`.
2. `<section id="home">` wrapping `<ExperienceLanding audience="customer"
   Icon={Icon} onPrimary={onStartBuilder} />` (hero CTA "Build my outfit"
   keeps its existing login-gated behavior).
3. `<section id="about">` — heading + three cards: The system, The problem,
   The solution (copy below).
4. `<section id="team">` — heading + 5 member cards: avatar circle placeholder,
   "Name coming soon", "Role TBD".
5. `<section id="links">` — heading + 3 link cards: GitHub, Live demo,
   Presentation — each "Coming soon", not focusable while placeholder.

Data:

```ts
const TEAM: { name?: string; role?: string }[] = [{}, {}, {}, {}, {}]
const LINKS: { label: string; href?: string }[] = [
  { label: "GitHub" },
  { label: "Live demo" },
  { label: "Presentation" },
]
```

When a member has `name`/`role`, the card displays them; when a link has
`href`, the card renders as a real anchor (otherwise a disabled placeholder).

### `src/pages/customer/HomePage.tsx` (simplified)

Renders `<ProjectLanding onStartBuilder={onStartBuilder} />` only. The
"Start your flow" markup is removed; props reduce to `{ onStartBuilder }`.

### `src/components/CustomerShop.tsx` (call site)

Stop passing the removed `image`/`category`/`setCategory` props to `HomePage`.
`category` state remains (OutfitPage uses it). Nothing else changes.

## About copy (draft, for approval)

- **The system** — "Forma is an AI-assisted fashion platform. Customers start
  with one piece they love; the outfit builder completes the look from the real
  catalogue — by style, occasion, palette and in-stock availability. A virtual
  fitting studio previews the outfit on an uploaded model photo, and an AI
  stylist answers styling questions. Merchants connect their catalogue through
  CSV or API import, with AI photo classification filling in product
  attributes."
- **The problem** — "Building a complete look online is fragmented. Shoppers
  browse pieces in isolation, struggle to picture how items work together, and
  second-guess fit and style — driving abandoned carts and returns. Small
  merchants lack the tools to merchandise their catalogue as outfits or to show
  how their pieces combine."
- **The solution** — "Forma turns one piece into a whole look. The builder
  recommends compatible, in-stock pieces around the customer's starting choice;
  the fitting studio and photo stylist use AI to preview the result before
  buying. For merchants, one pipeline — import, classify, manage — keeps every
  recommendation grounded in what is actually available."

## Styling

Appended to `src/index.css`, reusing existing tokens (`--surface`, `--border`,
`--radius-soft`, `--space-*`, typography and card look of
`.landing-feature-card`):

- `.landing-section-nav` — sticky
  (`top: calc(var(--header-height) + var(--space-6))`), pill buttons matching
  existing nav conventions; horizontally scrollable on narrow screens.
- `.landing-section` — `scroll-margin-top: calc(var(--header-height) +
  var(--space-6) + 72px)` (nav bar height + gap) so headings land below the
  sticky chrome.
- `.landing-about-grid` (3 columns desktop → 1 column mobile),
  `.landing-team-grid` (5 up → wrap responsively), `.landing-links-grid`.
- `.landing-placeholder-card` — reused by Team/Links placeholders.
- Responsive rules at the existing breakpoints used by adjacent landing styles.

## Accessibility

- Nav items are buttons inside labelled `<nav>`; `aria-current` marks the
  active section.
- Sections use headings with ids (`aria-labelledby` on the section).
- Placeholder link cards are `aria-disabled="true"` and not focusable until
  they gain an `href`.
- Smooth scrolling must be disabled under `prefers-reduced-motion` (JS check;
  CSS `scroll-behavior` not used to avoid fighting the JS behavior).

## Deliberate non-changes

- `ExperienceLanding` internals (hero, mosaic, feature cards) untouched.
- Header shop nav (Forma / Home / Outfits), hash routing, login gate, merchant
  shell, OutfitPage and StylistChat untouched.
- No scroll-spy / active-section tracking on scroll (click-set only).
- No CMS or data layer for team/links; arrays in the component file.

## Acceptance criteria

1. `#/shop` home tab shows sections Home, About, Team, Links with a sticky
   anchor bar below the shop header.
2. Clicking Home/About/Team/Links scrolls to the matching section; section
   headings are not hidden under sticky chrome. Under `prefers-reduced-motion`
   the scroll is instant.
3. About shows the three system/problem/solution cards with this spec's copy.
4. Team shows exactly 5 placeholder member cards; Links shows 3 placeholder
   cards; filling `TEAM`/`LINKS` entries updates the UI (names, roles, real
   links) with no structural changes.
5. "Start your flow" is gone; the hero CTA still routes through the existing
   login gate into the outfit builder.
6. Logged-out/logged-in flows, the Outfits tab, and the merchant shell behave
   exactly as before.
7. Landing renders without overflow at mobile and desktop widths.
8. `pnpm build` passes; existing tests (`pnpm test`) still pass.

## Verification

- `pnpm build` and `pnpm test`.
- Manual pass in the dev preview (Vite, port 8443): anchor scrolling, sticky
  offset, reduced-motion behavior, narrow/wide widths, a11y labels.

## Files touched

- `src/components/ProjectLanding.tsx` (new)
- `src/pages/customer/HomePage.tsx`
- `src/components/CustomerShop.tsx` (call-site props only)
- `src/index.css` (landing section styles appended)
