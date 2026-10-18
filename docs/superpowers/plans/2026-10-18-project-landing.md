# Project Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shop home tab's "Start your flow" section with a four-section project landing page (Home / About / Team / Links) plus a sticky anchor navigation, per the approved spec.

**Architecture:** One new component file `src/components/ProjectLanding.tsx` owns the anchor nav and the About/Team/Links sections (data-driven from module-level `ABOUT`/`TEAM`/`LINKS` arrays) and wraps the existing `ExperienceLanding` as the Home section. `HomePage.tsx` shrinks to a thin wrapper. All styling is appended to `src/index.css` using existing tokens. No routing changes — anchor clicks call `scrollIntoView` on refs, never `location.hash`.

**Tech Stack:** React 19, TypeScript 5.7 (strict), Vite 8, vitest (node-only), plain CSS in `src/index.css`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-18-project-landing-design.md` (committed `719be94`).

## Global Constraints

- No new dependencies. Do not modify `package.json`.
- Do not touch: hash routing (`src/App.tsx`), `src/components/ExperienceLanding.tsx` internals, the shop header inside `CustomerShop.tsx`, the login gate, `OutfitPage`, the merchant shell.
- Anchor nav must never change `window.location.hash` (the hash router would remount the route). Use `scrollIntoView` on section refs.
- `prefers-reduced-motion: reduce` must switch the scroll to instant — this must be a JS `window.matchMedia("(prefers-reduced-motion: reduce)")` check at click time. The CSS reduced-motion block (index.css:1142) cannot override an explicitly passed `scrollIntoView({ behavior: "smooth" })`.
- About copy and section structure are fixed by the spec. Copy the strings exactly (double-quoted JS strings — AGENTS.md apostrophe rule).
- Exactly 5 team entries and exactly 3 link entries (GitHub, Live demo, Presentation).
- Testing reality: vitest runs node-only tests in `src/lib/__tests__` (no DOM/component test infrastructure; adding one is out of scope). UI tasks verify with `npx tsc -p tsconfig.json` (baseline is clean, exit 0), `pnpm build`, `pnpm test`, and the manual dev-preview checklist in Task 3.
- The Vite dev server is already running on port 8443 with hot reload (AGENTS.md). Do not start another one.
- Layout math used below: the shop header is sticky at `top: var(--space-4)` (16px) with `height: var(--header-height)` (64px), so its stuck bottom edge is 80px. The anchor bar sticks at `top: calc(var(--header-height) + var(--space-6))` = 96px (16px below the header). Sections get `scroll-margin-top: calc(var(--header-height) + var(--space-6) + 72px)` = 168px so headings land below both sticky bars.

---

### Task 1: Landing section styles

**Files:**
- Modify: `src/index.css` (append at end of file, after the last line `.fitting-gate h2 { font-size: var(--text-lg); }`)

**Interfaces:**
- Consumes: existing design tokens only (`--header-height`, `--space-*`, `--material-thin`, `--vibrancy-thin`, `--specular-highlight`, `--shadow-ambient`, `--hover`, `--radius-pill`, `--radius-soft`, `--charcoal`, `--elevation`, `--motion`, `--motion-ease`, `--control-small`) and the global `.eyebrow` class (index.css:220).
- Produces: class names consumed by Task 2 — `.landing-section-nav` (+ `button`, `button.active`), `.landing-section`, `.landing-section-heading`, `.landing-about-grid`, `.landing-team-grid`, `.landing-links-grid`, `.landing-info-card`, `.landing-placeholder-card`, `.landing-team-card`, `.landing-avatar`, `.landing-link-card`, `.landing-link-icon`. (Verified: none of these names exist in `src/` today.)

- [ ] **Step 1: Append the landing styles to `src/index.css`**

Append exactly this block as the new end of `src/index.css`:

```css
/* Project landing: sticky section nav + About/Team/Links sections. */
.landing-section-nav {
  position: sticky;
  top: calc(var(--header-height) + var(--space-6));
  z-index: 30;
  display: flex;
  gap: var(--space-1);
  width: fit-content;
  max-width: 100%;
  margin: 0 auto var(--space-5);
  padding: var(--space-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--material-thin);
  -webkit-backdrop-filter: var(--vibrancy-thin);
  backdrop-filter: var(--vibrancy-thin);
  box-shadow: var(--specular-highlight), var(--shadow-ambient);
  overflow-x: auto;
}
.landing-section-nav button {
  min-height: var(--control-small);
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--ink);
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--motion) var(--motion-ease), color var(--motion) var(--motion-ease);
}
.landing-section-nav button:hover { background: var(--hover); }
.landing-section-nav button.active { background: var(--ink); color: var(--surface); box-shadow: var(--shadow-ambient); }

.landing-section { scroll-margin-top: calc(var(--header-height) + var(--space-6) + 72px); padding-top: var(--space-6); }
.landing-section + .landing-section { border-top: 1px solid var(--border); margin-top: var(--space-6); }

.landing-section-heading { max-width: 640px; margin-bottom: var(--space-5); }
.landing-section-heading .eyebrow { margin-bottom: var(--space-2); }
.landing-section-heading h2 { font-size: var(--text-xl); font-weight: 550; letter-spacing: -.6px; }

.landing-about-grid, .landing-links-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); }
.landing-team-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--space-4); }

.landing-info-card, .landing-placeholder-card, .landing-link-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-soft);
}
.landing-info-card h3 { font-size: var(--text-base); font-weight: 550; letter-spacing: -.3px; }
.landing-info-card p { color: var(--muted); font-size: var(--text-sm); line-height: 1.8; }
.landing-placeholder-card strong, .landing-link-card strong { font-size: var(--text-base); font-weight: 550; }
.landing-placeholder-card small, .landing-link-card small { color: var(--muted); font-size: var(--text-sm); }

.landing-team-card { align-items: center; text-align: center; }
.landing-avatar { display: grid; place-items: center; width: 64px; height: 64px; border-radius: var(--radius-pill); background: var(--charcoal); color: var(--surface); font-weight: 600; letter-spacing: .5px; }

.landing-link-card { color: inherit; text-decoration: none; transition: border-color var(--motion) var(--motion-ease), box-shadow var(--motion) var(--motion-ease); }
a.landing-link-card:hover { border-color: var(--border-strong); box-shadow: var(--elevation); }

.landing-link-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: var(--radius-pill); background: var(--charcoal); color: var(--surface); box-shadow: var(--shadow-ambient); }
.landing-link-icon .icon { width: 18px; height: 18px; }

@media (max-width: 950px) {
  .landing-about-grid, .landing-links-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .landing-team-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 700px) {
  /* The shop header can grow to two rows on narrow screens; re-anchor below it. */
  .landing-section-nav { top: 124px; }
  .landing-section { scroll-margin-top: 192px; }
}
@media (max-width: 650px) {
  .landing-about-grid, .landing-links-grid { grid-template-columns: minmax(0, 1fr); }
  .landing-team-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

- [ ] **Step 2: Verify the build still passes**

Run: `pnpm build`
Expected: exit 0, "built in ..." with no errors. (Nothing references the new classes yet; Vite just processes the stylesheet.)

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add project landing section styles"
```

---

### Task 2: `ProjectLanding` component

**Files:**
- Create: `src/components/ProjectLanding.tsx`

**Interfaces:**
- Consumes:
  - `ExperienceLanding` default export from `@/components/ExperienceLanding` — props `{ audience: "customer" | "merchant"; image?: string; productCount?: number; source?: string; Icon: ComponentType<{ name: string }>; onPrimary: () => void; onSecondary?: () => void }`. The `image` prop is declared but never read inside the component, so omit it.
  - `Icon` named export from `@/components/Icon` — `{ name: string }`.
  - `initials(name: string): string` from `@/lib/session` (session.ts:40).
- Produces: `export default function ProjectLanding({ onStartBuilder }: { onStartBuilder: () => void })` — consumed by `HomePage` in Task 3.

- [ ] **Step 1: Create `src/components/ProjectLanding.tsx`**

```tsx
import { useRef, useState } from "react"
import ExperienceLanding from "@/components/ExperienceLanding"
import { Icon } from "@/components/Icon"
import { initials } from "@/lib/session"

type SectionId = "home" | "about" | "team" | "links"

type Props = {
  /** Open the outfit builder. */
  onStartBuilder: () => void
}

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "team", label: "Team" },
  { id: "links", label: "Links" },
]

const ABOUT: { title: string; body: string }[] = [
  {
    title: "The system",
    body: "Forma is an AI-assisted fashion platform. Customers start with one piece they love; the outfit builder completes the look from the real catalogue — by style, occasion, palette and in-stock availability. A virtual fitting studio previews the outfit on an uploaded model photo, and an AI stylist answers styling questions. Merchants connect their catalogue through CSV or API import, with AI photo classification filling in product attributes.",
  },
  {
    title: "The problem",
    body: "Building a complete look online is fragmented. Shoppers browse pieces in isolation, struggle to picture how items work together, and second-guess fit and style — driving abandoned carts and returns. Small merchants lack the tools to merchandise their catalogue as outfits or to show how their pieces combine.",
  },
  {
    title: "The solution",
    body: "Forma turns one piece into a whole look. The builder recommends compatible, in-stock pieces around the customer's starting choice; the fitting studio and photo stylist use AI to preview the result before buying. For merchants, one pipeline — import, classify, manage — keeps every recommendation grounded in what is actually available.",
  },
]

const TEAM: { name?: string; role?: string }[] = [{}, {}, {}, {}, {}]

const LINKS: { label: string; href?: string }[] = [
  { label: "GitHub" },
  { label: "Live demo" },
  { label: "Presentation" },
]

export default function ProjectLanding({ onStartBuilder }: Props) {
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    home: null,
    about: null,
    team: null,
    links: null,
  })
  const [active, setActive] = useState<SectionId>("home")

  const goToSection = (id: SectionId) => {
    setActive(id)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    sectionRefs.current[id]?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    })
  }

  return (
    <>
      <nav className="landing-section-nav" aria-label="Landing sections">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={id === active ? "active" : undefined}
            aria-current={id === active ? "true" : undefined}
            onClick={() => goToSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section
        id="home"
        className="landing-section"
        aria-label="Home"
        ref={(el) => {
          sectionRefs.current.home = el
        }}
      >
        <ExperienceLanding audience="customer" Icon={Icon} onPrimary={onStartBuilder} />
      </section>

      <section
        id="about"
        className="landing-section"
        aria-labelledby="landing-about-title"
        ref={(el) => {
          sectionRefs.current.about = el
        }}
      >
        <div className="landing-section-heading">
          <span className="eyebrow">ABOUT</span>
          <h2 id="landing-about-title">About Forma</h2>
        </div>
        <div className="landing-about-grid">
          {ABOUT.map((card) => (
            <article key={card.title} className="landing-info-card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="team"
        className="landing-section"
        aria-labelledby="landing-team-title"
        ref={(el) => {
          sectionRefs.current.team = el
        }}
      >
        <div className="landing-section-heading">
          <span className="eyebrow">TEAM</span>
          <h2 id="landing-team-title">Meet the team</h2>
        </div>
        <div className="landing-team-grid">
          {TEAM.map((member, index) => (
            <article key={index} className="landing-placeholder-card landing-team-card">
              <span className="landing-avatar" aria-hidden="true">
                {member.name ? initials(member.name) : "—"}
              </span>
              <strong>{member.name ?? "Name coming soon"}</strong>
              <small>{member.role ?? "Role TBD"}</small>
            </article>
          ))}
        </div>
      </section>

      <section
        id="links"
        className="landing-section"
        aria-labelledby="landing-links-title"
        ref={(el) => {
          sectionRefs.current.links = el
        }}
      >
        <div className="landing-section-heading">
          <span className="eyebrow">LINKS</span>
          <h2 id="landing-links-title">Project links</h2>
        </div>
        <div className="landing-links-grid">
          {LINKS.map((link) =>
            link.href ? (
              <a
                key={link.label}
                className="landing-link-card"
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className="landing-link-icon"><Icon name="link" /></span>
                <strong>{link.label}</strong>
                <small>Open link</small>
              </a>
            ) : (
              <div key={link.label} className="landing-placeholder-card" aria-disabled="true">
                <span className="landing-link-icon"><Icon name="link" /></span>
                <strong>{link.label}</strong>
                <small>Coming soon</small>
              </div>
            )
          )}
        </div>
      </section>
    </>
  )
}
```

Notes for the implementer:

- Ref callbacks MUST use block bodies (`ref={(el) => { ... }}`). An expression-bodied arrow returns the assignment value, which React 19 interprets as a cleanup function.
- The Home section wraps `ExperienceLanding` whose `h1` has an `aria-label` but no `id`; `ExperienceLanding` must stay untouched, so the home section gets `aria-label="Home"` instead of `aria-labelledby`.
- Placeholder link cards are `<div aria-disabled="true">` — not focusable, per spec.

- [ ] **Step 2: Typecheck and build**

Run: `npx tsc -p tsconfig.json`
Expected: exit 0, no output.

Run: `pnpm build`
Expected: exit 0. (The component is not referenced by any route yet; this verifies it compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectLanding.tsx
git commit -m "feat: add ProjectLanding component"
```

---

### Task 3: Wire the landing into the home tab and remove dead styles

**Files:**
- Modify: `src/pages/customer/HomePage.tsx` (replace entire file)
- Modify: `src/components/CustomerShop.tsx` (HomePage call site, lines 497-502)
- Modify: `src/index.css` (remove the now-dead `.home-entry*` rules at lines 1150-1162 and the `.home-paths` rule at line 1249)

**Interfaces:**
- Consumes: `ProjectLanding` default export from Task 2 — `{ onStartBuilder: () => void }`.
- Produces: nothing consumed by later tasks; this task makes the feature user-visible.

- [ ] **Step 1: Replace `src/pages/customer/HomePage.tsx` with a thin wrapper**

Full new file content:

```tsx
import ProjectLanding from "@/components/ProjectLanding"

type Props = {
  /** Open the outfit builder. */
  onStartBuilder: () => void
}

export default function HomePage({ onStartBuilder }: Props) {
  return <ProjectLanding onStartBuilder={onStartBuilder} />
}
```

- [ ] **Step 2: Update the `HomePage` call site in `src/components/CustomerShop.tsx`**

Edit lines 497-502 — replace:

```tsx
            <HomePage
              image={image}
              category={category}
              setCategory={setCategory}
              onStartBuilder={() => { go("collection") }}
            />
```

with:

```tsx
            <HomePage onStartBuilder={() => { go("collection") }} />
```

`image`, `category` and `setCategory` remain used elsewhere (`image` is passed to `OutfitPage`, `category` drives the Outfits tab), so no other edits are needed there.

- [ ] **Step 3: Remove the dead "Start your flow" CSS**

In `src/index.css`, delete exactly this block (currently lines 1150-1162, directly after the comment `/* Customer workflow: Home | Outfits | Setting. */` — keep that comment):

```css
.home-entry { padding: var(--space-6) 0; border-top: 1px solid var(--border); margin-top: var(--space-6); }
.home-entry-heading h2 { font-size: var(--text-xl); font-weight: 550; letter-spacing: -.6px; }
.home-entry-heading p { color: var(--muted); font-size: var(--text-sm); margin-top: var(--space-2); }
.home-entry-steps { display: grid; gap: var(--space-4); margin-top: var(--space-5); }
.home-step { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: var(--space-4); align-items: start; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-soft); padding: var(--space-5); }
.home-step-number { display: grid; place-items: center; width: 40px; height: 40px; border-radius: var(--radius-pill); background: var(--charcoal); color: var(--surface); font-weight: 600; font-size: var(--text-base); }
.home-step strong { display: block; font-size: var(--text-base); font-weight: 550; margin-bottom: var(--space-3); }
.home-categories { display: flex; flex-wrap: wrap; }
.home-paths { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: var(--space-4); }
.home-path-card { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-2); text-align: left; background: var(--background); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-5); cursor: pointer; }
.home-path-card:hover { border-color: var(--border-strong); background: var(--surface-subtle); }
.home-path-card strong { font-size: var(--text-base); margin: 0; }
.home-path-card small { color: var(--muted); font-size: var(--text-sm); line-height: 1.7; }
```

Then inside the `@media (max-width: 650px)` block (currently line 1248), delete only this line (keep the `.builder-side .shop-grid` and settings rules that surround it):

```css
  .home-paths { grid-template-columns: minmax(0, 1fr); }
```

- [ ] **Step 4: Verify types, build, and tests**

Run: `npx tsc -p tsconfig.json`
Expected: exit 0, no output.

Run: `pnpm build`
Expected: exit 0.

Run: `pnpm test`
Expected: all existing `src/lib/__tests__` suites pass (same count as before this plan; live tests are excluded by the script).

- [ ] **Step 5: Manual verification in the dev preview (port 8443, hot reload already running)**

Walk this checklist in the preview:

1. The app lands on the shop Home tab (`#/shop`): hero, photo mosaic, feature cards, then About / Team / Links below, with the sticky anchor bar (Home / About / Team / Links) pinned below the shop header.
2. Click "Team" → smooth-scrolls; the "Meet the team" heading is fully visible below the sticky bars (not hidden under them); the Team button turns dark (active).
3. Click "Home" → scrolls back to the hero; Home button active.
4. About shows exactly 3 cards — The system / The problem / The solution — with the spec copy.
5. Team shows exactly 5 cards ("Name coming soon" / "Role TBD"); Links shows exactly 3 cards (GitHub, Live demo, Presentation, each "Coming soon").
6. Press Tab through the Links section — the 3 placeholder cards are skipped (not focusable).
7. The text "Start your flow" no longer appears anywhere on the page.
8. Hero CTA "Build my outfit": logged out → opens the login gate; after logging in it continues to the outfit builder exactly as before.
9. DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → clicking "About" jumps instantly (no smooth animation).
10. Narrow the window: ~1400px → 5 team cards in one row; ≤950px → 3; ≤650px → 2. At ~640px the anchor bar does not overlap the shop header and no horizontal scrollbar appears at any width.
11. Spot-check unchanged behavior: cart button, login/logout, the Outfits tab, and the merchant shell.

If check 10 shows the anchor bar overlapping the header (or a large gap) at ~640px, adjust the two values in the `@media (max-width: 700px)` block of `src/index.css` (`.landing-section-nav` top and `.landing-section` scroll-margin-top) so the bar sits just below the header, then re-run check 10.

- [ ] **Step 6: Commit**

```bash
git add src/pages/customer/HomePage.tsx src/components/CustomerShop.tsx src/index.css
git commit -m "feat: replace home entry section with project landing"
```

---

## Acceptance criteria mapping (from the spec)

1. Sections + sticky anchor bar → Tasks 2-3 (JSX), Task 1 (CSS).
2. Anchor scrolling + sticky offset + reduced motion → Task 2 `goToSection`, Task 1 `scroll-margin-top`, Task 3 check 2, 3, 9.
3. About copy → Task 2 `ABOUT` (verbatim spec copy).
4. 5 team cards + 3 link placeholder cards, data-driven → Task 2 `TEAM`/`LINKS`, Task 3 checks 5-6.
5. "Start your flow" removed; hero CTA login-gated → Task 3 Steps 1-3, checks 7-8.
6. Other flows unchanged → Task 3 check 11.
7. No overflow, mobile + desktop → Task 1 media queries, Task 3 check 10.
8. `pnpm build` + `pnpm test` pass → Task 3 Step 4.
