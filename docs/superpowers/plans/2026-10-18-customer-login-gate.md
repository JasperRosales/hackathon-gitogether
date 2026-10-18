# Customer Login Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the customer workflow landing page → log in → outfit builder: logged-out users cannot open or use the Outfits section, login returns them to where they tried to go, and logout lands on the public landing page.

**Architecture:** A route guard in `src/App.tsx`, mirroring the existing `needsMerchantLogin` guard. A pure helper `isProtectedShopRoute` classifies hash routes; while the guard is active, `LoginPage` renders instead of `CustomerShop` and the URL is rewritten to `#/login` with `history.replaceState` (so Back does not loop). `postLoginRoute` already exists and is reused for deep-link return.

**Tech Stack:** React 19, TypeScript 5.7, Vite 8, hash-based routing (no router library).

## Global Constraints

- Only `src/App.tsx` may change. Do NOT modify `src/components/CustomerShop.tsx`, `src/pages/customer/OutfitPage.tsx`, or any other file (per approved spec `docs/superpowers/specs/2026-10-18-customer-login-gate-design.md`).
- No new dependencies. This project has no test framework — do NOT add one. Verification is `npm run build` plus the manual checklist in Task 3.
- Hash routes only. Do not introduce a router library or new routes.
- Merchant behavior must not change: merchant login targets `/merchant`, the `needsMerchantLogin` guard stays as-is. Logout now goes to `#/shop` for both roles (approved).
- Code style (AGENTS.md): double quotes for strings with apostrophes; keep JSX balanced; default exports for components. Match the existing comment style in `App.tsx`.
- Current branch: `feature/customer-login-gate` (spec commit `896b9a3` already on it). Work directly on it.

---

### Task 1: Guard Outfits routes behind login

**Files:**
- Modify: `src/App.tsx` (add helper after `const image = fittingModel` near line 27; wire guard in the `needsMerchantLogin` block near lines 113–126)

**Interfaces:**
- Consumes: existing `session` state (`Session | null`), `route` state (hash string like `"#/shop/outfits"`), `setPostLoginRoute`, `setRoute`.
- Produces: `isProtectedShopRoute(route: string): boolean` (module-level, `src/App.tsx`); `needsCustomerLogin: boolean` local to `App()`; the early return condition now also renders `LoginPage` when `needsCustomerLogin` is true. Task 2 relies on `postLoginRoute` being set by this guard.

- [ ] **Step 1: Add the route-classification helper**

Add directly below `const image = fittingModel` in `src/App.tsx`:

```tsx
// Outfits-section paths require a signed-in customer. Keep in sync with the
// hash parsing in src/components/CustomerShop.tsx (readLocation).
const protectedShopSections = new Set([
  "outfits",
  "product",
  "fitting",
  "cart",
  "builder",
  "collection",
])

function isProtectedShopRoute(route: string) {
  const [, root, section] = route.replace(/^#/, "").split("/")
  return root === "shop" && protectedShopSections.has(section ?? "")
}
```

Rationale: `#/shop` (landing), `#/shop/setting` (legacy alias) and unknown sections are public because they are not in the set; the legacy aliases for builder sub-pages are included because `CustomerShop` maps them into the Outfits tab.

- [ ] **Step 2: Wire the guard**

In `src/App.tsx`, replace the block that currently reads:

```tsx
  const needsMerchantLogin =
    route === "#/merchant" && session?.role !== "merchant"
  useEffect(() => {
    if (needsMerchantLogin) {
      window.history.replaceState(null, "", "#/login")
      setRoute("#/login")
    }
  }, [needsMerchantLogin])
  if (route === "#/login" || needsMerchantLogin)
```

with:

```tsx
  const needsMerchantLogin =
    route === "#/merchant" && session?.role !== "merchant"
  const needsCustomerLogin = !session && isProtectedShopRoute(route)
  useEffect(() => {
    if (needsMerchantLogin) {
      window.history.replaceState(null, "", "#/login")
      setRoute("#/login")
    }
  }, [needsMerchantLogin])
  useEffect(() => {
    if (needsCustomerLogin) {
      setPostLoginRoute(route)
      window.history.replaceState(null, "", "#/login")
      setRoute("#/login")
    }
  }, [needsCustomerLogin, route])
  if (route === "#/login" || needsMerchantLogin || needsCustomerLogin)
```

Why `replaceState`: it rewrites the current history entry instead of pushing a new one, so pressing Back after the bounce returns to the previous real page (e.g., the landing) instead of bouncing into a redirect loop.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: `✓ built in …` with no errors.

- [ ] **Step 4: Manual verification of the guard**

Start the dev server if it is not running (`npm run dev`) and open the preview. In a fresh tab (no stored session):

1. Open `#/shop` → landing renders (categories, "Start your flow"); no login redirect.
2. Edit the URL to `#/shop/outfits` → login page renders and the URL bar shows `#/login`.
3. Press Back → landing page renders; pressing Forward does not bounce in a loop.
4. Open `#/shop/outfits/fitting` → login page; after logging in as Customer (password `forma-demo`) you land on the fitting studio view.

Expected: all four checks pass. If any fail, fix `isProtectedShopRoute` or the guard effect before committing.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: gate outfit builder behind customer login"
```

---

### Task 2: Login and logout destinations

**Files:**
- Modify: `src/App.tsx` (the `login` function near line 95 and the `logout` function near line 105)

**Interfaces:**
- Consumes: `postLoginRoute` (set by Task 1's guard or by `requireLogin`), `navigate(path: string)`.
- Produces: customer login default target `/shop/outfits`; logout target `/shop` with cleared `postLoginRoute`. No new exported symbols.

- [ ] **Step 1: Change the customer post-login default**

In `login`, replace:

```tsx
    const target =
      account.role === "merchant" ? "/merchant" : postLoginRoute ?? "/shop"
```

with:

```tsx
    const target =
      account.role === "merchant"
        ? "/merchant"
        : postLoginRoute ?? "/shop/outfits"
```

- [ ] **Step 2: Change logout to the landing page and clear the return target**

Replace the `logout` function body:

```tsx
  const logout = () => {
    clearStoredSession()
    setSession(null)
    setToast("")
    setAdminPage("home")
    setQuery("")
    navigate("/login")
  }
```

with:

```tsx
  const logout = () => {
    clearStoredSession()
    setSession(null)
    setToast("")
    setAdminPage("home")
    setQuery("")
    setPostLoginRoute(null)
    navigate("/shop")
  }
```

Why clear `postLoginRoute`: without it, a login detour target from before logging out could misroute the next voluntary login.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: `✓ built in …` with no errors.

- [ ] **Step 4: Manual verification of destinations**

In the dev preview:

1. Logged out on the landing, click the nav "Log in" button → login page → log in as Customer → land on the outfit builder collection view (`#/shop/outfits`).
2. Log out → land on `#/shop` (landing).
3. Logged out, open `#/shop/outfits/cart` directly → login page → log in as Customer → land on the cart view.
4. Log out, then log in as Merchant → land on `#/merchant` (admin shell), unchanged.
5. While logged in as Merchant, click "Log out" in the admin topbar → land on `#/shop` (landing).

Expected: all five checks pass.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: land customers in builder after login, landing after logout"
```

---

### Task 3: Acceptance sweep

**Files:**
- No code changes expected. If a check fails, fix `src/App.tsx` and re-run Step 1.

**Interfaces:**
- Consumes: everything from Tasks 1–2.
- Produces: confirmation against the spec's acceptance criteria.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: success.

- [ ] **Step 2: Walk the spec acceptance checklist**

From `docs/superpowers/specs/2026-10-18-customer-login-gate-design.md`, in a fresh tab unless stated:

1. Logged out, `#/shop` renders the landing with categories; no builder UI reachable.
2. Logged out, clicking the Outfits nav tab opens the login page; the "Open outfit builder" card does the same.
3. Logged out, each protected URL opens the login page: `#/shop/outfits`, `#/shop/outfits/collection`, `#/shop/fitting`, `#/shop/cart`, `#/shop/product/<any-sku>`, `#/shop/builder`. And `#/shop/setting` still renders the landing (public).
4. Customer login from a blocked sub-view returns to that exact view; voluntary login (nav "Log in") lands on `/shop/outfits`.
5. Back button after a login bounce returns to the landing, not a loop.
6. Logout returns to `#/shop`.
7. Merchant login flow and admin shell unchanged (merchant logout also returns to the landing).
8. Build passes (Step 1).

Expected: every item passes. Report any failure with the URL and observed behavior.

- [ ] **Step 3: No commit needed**

Task 3 makes no changes when all checks pass. If fixes were required, commit them with:

```bash
git add src/App.tsx
git commit -m "fix: address login gate acceptance findings"
```
