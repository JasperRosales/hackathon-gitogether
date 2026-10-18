# Customer Login Gate — Design

Date: 2026-10-18
Status: Approved for planning
Scope: Customer storefront workflow: landing page → log in → outfit builder.
Logged-out users cannot open or use the outfit builder (the entire Outfits section).

## Context

- Hash-routed SPA. `src/App.tsx` owns session state, route state, login/logout,
  and the existing merchant guard (`needsMerchantLogin`).
- `src/components/CustomerShop.tsx` owns the customer shell and parses
  `#/shop/...` subpaths into a tab (`home`/`outfits`) and, under Outfits, a view
  (`collection`/`product`/`fitting`/`cart`).
- Today, only the fitting studio prompts for login (`OutfitPage.tsx`
  `openFitting`, `signedIn` gate). The collection/builder is fully usable while
  logged out.
- Login is a local demo: `LoginPage` → `App.login()` stores the session and
  routes by role; `postLoginRoute` already supports returning to an attempted
  page.

## Decisions

1. Everything in the Outfits section requires login. The landing page (`Home`
   tab) stays public.
2. After customer login: land in the outfit builder; if the user was blocked
   from a specific sub-view, return to that exact view.
3. After logout: land on the public landing page.

## Route classification

Public customer routes (render normally when logged out):

- `#/shop`, empty hash
- `#/shop/setting` (legacy alias for Home)
- unknown `#/shop/*` sections (the shop parser already falls back to Home)

Protected routes (require a logged-in session):

- `#/shop/outfits` and any deeper path (`#/shop/outfits/collection`,
  `/fitting`, `/cart`, `/product/<sku>`)
- legacy aliases: `#/shop/fitting`, `#/shop/cart`, `#/shop/product/<sku>`,
  `#/shop/builder`, `#/shop/collection`

Non-customer routes (`#/login`, `#/merchant`) are unchanged.

Implementation: a small pure helper `isProtectedShopRoute(route: string)` next
to the guard logic in `App.tsx`, derived from the same section list the shop
parser understands (keep them documented as coupled).

## Guard behavior

- `needsCustomerLogin = !session && isProtectedShopRoute(route)`.
- Mirrors the merchant guard pattern:
  - render `LoginPage` instead of `CustomerShop` while the guard is active
    (extend the existing early-return condition),
  - `window.history.replaceState(null, "", "#/login")` so the Back button
    returns to the previous real page (no redirect loop),
  - store the attempted route in `postLoginRoute`.
- `login()` for customers targets `postLoginRoute ?? "/shop/outfits"`.
  Merchants still go to `#/merchant`.
- `postLoginRoute` is cleared after login (already) and now also on logout.

## Logout

- `logout()` navigates to `#/shop` instead of `#/login` (both roles; the
  landing is the public entry).
- Clears `postLoginRoute` to prevent stale redirects.

## Deliberate non-changes

- "Outfits" nav tab and "Open outfit builder" CTA stay visible when logged out;
  activating them exercises the guard (prompt to log in).
- Stylist chat remains available on public pages; its add-to-outfit/cart
  actions are unchanged (effects are only visible inside the gated builder).
- `OutfitPage`'s `signedIn` fitting gate and pending-outfit save stay as
  defensive code; normal flows can no longer reach them logged out.
- Merchant login flow, real-auth scope, and all admin pages untouched.

## Acceptance criteria

1. Logged out, `#/shop` renders the landing with categories; no builder UI is
   reachable.
2. Logged out, clicking Outfits tab / Open outfit builder / any builder CTA
   opens the login page.
3. Logged out, opening any protected URL directly (including legacy aliases)
   opens the login page.
4. Customer login from a blocked sub-view returns to that view (e.g., fitting,
   cart, product); voluntary login (nav "Log in") lands on `/shop/outfits`.
5. Back button from the login bounce returns to the landing, not a loop.
6. Logout returns to `#/shop`.
7. Merchant login flow and admin shell unchanged (merchant logout also returns
   to the landing, like customers).
8. `npm run build` passes.

## Verification

- `npm run build`.
- Manual pass of the acceptance criteria in the dev preview (Vite on port
  8443).

## Files touched

- `src/App.tsx` (guard, helper, login/logout targets)
- Spec only otherwise; no changes planned to `CustomerShop.tsx` or
  `OutfitPage.tsx`.
