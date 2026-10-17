# Forma interface system

## Current visual specification

`GLASS_SYSTEM.md` defines the current Apple-inspired light-vibrancy materials, token sheet, before/after component rules and responsive/accessibility states. Its material and navigation guidance supersedes the earlier opaque/charcoal styling descriptions below. `src/index.css` remains the executable source of truth.

### Inventory settings

Merchant Configuration is an inventory settings page, not just an API connector. **Add product** opens a validated product form. Clicking a product name in **Products & stock** opens price, category, color, image and per-size quantity editing without an Action column. Sizes must be unique; units are nonnegative integers; a zero quantity marks a size unavailable. Product removal requires explicit confirmation. Manual saves persist as a `Manual` catalogue in sessionStorage and feed the customer builder, including an intentionally empty catalogue. API-backed edits require confirmation to switch to manual management: they disconnect the read-only API and stop automatic refresh so local edits cannot be overwritten. CSV/API connections remain available for bulk or externally managed stock. No manual edit writes to a retailer service.

## Product boundaries

- `#/shop` (default): customer landing page. `#/shop/builder` opens the customer builder with single-piece and outfit-bundle modes. Browse/search/category filters → product details or add pieces → set style, occasion, palette, size and budget → review a single piece or recommend an outfit retaining chosen pieces → swap or enter fitting → add to a multi-bundle cart without navigating away. Product URLs use `#/shop/product/:sku`; fitting, outfit and cart views support browser history. The wordmark opens the builder. Customer login returns to the landing page.
- `#/merchant`: merchant workspace, gated by the selected merchant demo role. Home is the retailer landing page; Overview summarizes business metrics, Outfit intelligence focuses on recommendation patterns, and Configuration manages catalogue/inventory connections.
- `#/login`: shared customer/merchant demo login. Entered name replaces fabricated account identities. Both experience headers provide visible logout.

SessionStorage keeps the demo session through refresh in the current tab. Logout clears it and returns to login, unmounting photos/cart. Login uses a sample email/username and the explicitly disclosed demo password `forma-demo`. The password is only held in the form's memory, cleared on submission, and never persisted or transmitted. This is not secure authentication or verified role authorization; production requires an authentication service and server-side access controls. Login has no back-to-store or guest-continuation button, and the merchant header has no store-preview shortcut.

AI garment generation and native checkout are not connected. Catalogue data comes from sample fixtures, CSV imports or API snapshots refreshed manually or through opt-in visible-tab polling. Revenue/affinity tables and merchant KPIs are sample data, not validated results. The eight evaluation benchmarks remain in `REQUIREMENTS_AUDIT.md`.

Merchants can import actual catalogue/size-stock CSV records locally via **Import CSV**. Header columns are `sku,name,category,price,image_url,size,stock` with optional `color`. Files are ≤2MB / 5,000 size records; quoted values and repeated SKU sizes are supported. Invalid records block the entire import. Preview and explicit merge/replace confirmation precede changes. Matching SKUs replace all of that product's size records; image URLs are HTTP(S), rendered with a fallback if unavailable. Confirmed catalogues survive refresh in this tab via sessionStorage and feed both merchant and customer views. No credentials or retailer API changes occur. Storage failure leaves the previous catalogue intact.

## Visual architecture

### API snapshots and fitting imagery

**Connect API** reads a user-supplied public HTTPS/CORS endpoint or credential-free backend proxy. JSON can be an array or a `products`/`data` wrapper, with flat size/stock rows, a variants array, or a size-to-stock object. Required fields are sku, name, category, price, image_url (or imageUrl), and size/stock or variants; color is optional. Responses are streamed with a 2MB limit, 5,000 size-record limit and 15-second timeout. Preview does not mutate the catalogue. Confirmation applies an add/update or replace snapshot, persists the public endpoint/mode in this tab, and enables **Refresh API**. HTTP/CORS/schema/storage failures retain existing data.

No API keys, secret query parameters, embedded credentials, URL fragments, HTTP endpoints, redirects, authorization headers or cookies are accepted/sent. Private services require a separate secure backend connector. Configuration offers manual refresh or opt-in 30-second, 1-minute and 5-minute polling. Polling runs only for an authenticated merchant in a visible tab; it skips open import/API forms, avoids overlapping requests and preserves the current page. Failures retain the previous catalogue. This is browser-local read-only synchronization, not a server scheduler, webhook service or retailer stock reservation. Forms load on demand with opaque status feedback.

The fitting portrait is by Angga Pratama / Unsplash, sourced from `https://images.unsplash.com/photo-1771591742030-e22976e38aea` and bundled as `src/assets/fitting-model.jpg`. On-canvas attribution accompanies the original model image; it is not an AI-rendered outfit.

**Customer:** opaque white storefront, restrained serif wordmark and Inter controls. Editorial landing page with a photo hero and direct single-piece/bundle builder entry points. Cards open product details; separate Add to outfit controls select pieces for the sticky preference panel (stacked above products on mobile). Single-piece mode retains one garment; bundle mode recommends complementary categories. Fitting is available for either mode and directly from product details. The original-image preview is not AI try-on. Glass is restricted to elevated photo and bundle docks.

**Merchant:** freestanding charcoal navigation capsule within a 104px open gutter, circular active controls, and labelled hover/keyboard-focus tooltips. The store name and account actions sit directly on the page rather than in a bordered header strip. Four operational KPI modules use a charcoal lead metric, larger tabular values, semantic icons and concise context/demo footers. Tables remain opaque and dense with horizontal overflow; no hidden columns. Page and panel subtitles are removed; sync metadata and demo disclosures remain outside title blocks.

**Login:** focused form beside a charcoal product illustration panel. The illustration is omitted on mobile, keeping the form primary. Local-demo status stays explicit.

## Tokens

`src/index.css` is the source of truth; previous layered overrides have been replaced.

| Semantic token | Value |
|---|---|
| Ink / primary action | #000000 / #0B0B0B |
| Surface / background / inset | #FFFFFF / #F7F7F7 / #F0F0F0 |
| Secondary copy | #666666 |
| Decorative / control border | #E3E3E3 / #888888 |
| Elevated glass | rgba(255,255,255,.94) |
| Glass border | rgba(255,255,255,.8) |
| Elevation shadow | 0 8px 24px rgba(0,0,0,.1), elevated docks/notifications only |
| Blur presets | Fixed 16px; no merchant blur configuration |
| Radius | 8px controls, 12px data modules, 20px photo canvas, 999px action pills |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32px |
| Font | Inter 400–650; Georgia system serif for store wordmark |
| Type | 10px metadata, 12px small, 14px base, 18px emphasis, 36px heading |
| Motion | 150ms color/border changes; no tilt, spring, shimmer or decorative loaders |
| Action sizing | 32px compact (logout, table actions, segmented controls), 36px standard (sync), 40px primary (login, outfit preview, bundle cart); widths follow content except full-width forms |

### Contrast

Black on white 21:1; white on #0B0B0B approximately 19.7:1; #666 on white 5.74:1; #666 on #F7F7F7 approximately 5.36:1. Control border #888 on white approximately 3.54:1. Normal text exceeds WCAG AA 4.5:1; focus/selected indicators exceed 3:1. Structural borders are decorative, not sole state cues. Minimum 94% white glass preserves secondary text readability over dark imagery. Keyboard focus uses a black 2px outline; dark notifications use white.

## Components and deterministic states

| Component | Layout / states |
|---|---|
| Merchant nav | 224px white rail, icon and label, charcoal active pill; opaque hover; accessible labels retained on compact rail |
| KPI modules | Four 20px rounded modules: recommendation-assisted sales, average assisted order value, multi-item assisted order share and recommendation engagement; 14px gaps, 41px tabular values, charcoal lead metric; measurement definitions instead of evaluation goals; one sample-data disclosure in the merchant footer |
| Catalogue | Inset 14px rounded opaque frame, aligned prices, SKU hierarchy, stock labels; View variants opens a focused inline size-availability panel; Review alternatives opens same-category candidates filtered by size. Close/Escape returns focus to the row action. Inventory stays read-only. |
| Affinity table | Same inset frame, circular rank, aligned numeric values and muted swap text. Opportunity is plain advisory text, not a button or campaign action. |
| Import / sync | CSV file or HTTPS JSON API → validation → product/variant preview → add/update or replace → confirmation. API snapshots support manual refresh; sample sync stays explicitly demo-only. |
| Attention panel | Stock exception action opens catalogue filtered to its SKU; availability track is illustrative, not live |
| Garment selection | Multi-select toggles with aria-pressed, count, subtotal, per-piece removal and clear-all; retained across category/search/page changes; zero-stock cards disabled; every chosen SKU retained during generation |
| Outfit preferences | Style, occasion, neutral color palette, XS–XL, total budget and optional accessory; changes invalidate previous recommendations |
| Demo recommendations | Shared sample/CSV/API model; all chosen pieces are fixed constraints, including multiple items per category; fills missing categories within stock/size/color/budget constraints; incompatible selections produce a no-match state; no AI personalization |
| Swaps | Same-category alternatives checked against size, palette, remaining budget and duplicate SKUs; one slot changes; swapping a selected piece updates that selection only |
| Photo preview | Original image, JPG/PNG/WebP ≤10MB; explicit invalid-file feedback; object URLs revoked on replacement/unmount |
| Preview action | Static skeleton for simulated 1.2s work; truthful completion message; no generated garment image |
| Bundle summary | Derived total for variable-size bundle; rechecks constraints before local cart; cart review/removal; native checkout visibly unavailable without integration |
| Login | Required email/username and masked password, sample identifier validation, fixed demo password validation, selectable demo role and direct logout |

## Responsive rules

**Merchant:** above 950px, four-column KPIs and chart/attention split. At ≤950px, two-column metrics and stacked chart/attention. At ≤650px, the freestanding navigation becomes a bottom capsule, content spans full width with reserved bottom clearance, and tables scroll without concealing information. Logout remains visible in the open header.

**Customer:** maximum 1440px content width; desktop four-column collection and three-column selected collection beside a 330px preference panel. Narrow desktop uses three/two product columns. At ≤700px, two-column product grid and stacked preference panel, then single-column outfit review or optional 490px fitting canvas with sticky bundle dock. No modal or merchant switch appears in the customer header.

**Login:** desktop form/illustration split; ≤700px single-column form without decorative panel. Reduced-motion preference disables transitions.

## Required production integration

Secure authentication and verified roles, backend retailer isolation, catalogue API adapters, inventory freshness and server-side variant checks, hosted image processing, inference service and repeated model performance testing, consent/retention controls, native cart adapter, measured attribution and usability/accessibility testing. Production embedding should use isolated namespacing or Shadow DOM and an explicit host integration contract.
