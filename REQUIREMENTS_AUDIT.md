# Forma — concept compliance audit

Source: the user's latest “AI-Powered Virtual Fitting and Commerce Intelligence System” document. AMD-specific provisions are excluded from this audit. This document supersedes targets and optional controls from earlier UI briefs.

## Overall verdict

**Not all requirements are met.** The app supports browser-local CSV imports and read-only public/proxied HTTPS JSON API snapshots of products, images, prices, sizes and stock. Confirmed data updates merchant views and the shop. Customers can select multiple pieces, with all selections retained in rule-based recommendations. Fitting is optional after outfit review. A virtual try-on model, learned personalization, private credentialed platform adapters, automatic inventory synchronization, native checkout and validated business results remain unimplemented.

## Core capability traceability

| Concept requirement | Current behavior | Verdict / remaining work |
|---|---|---|
| 4.1 Upload a suitable photo | Validated JPG/PNG/WebP ≤10MB; original image shown locally | Partial. No suitability/pose detection, cropping or AI garment generation |
| 4.1 Preview selected garments/outfits through virtual try-on | Static model/original image; explicit **Virtual try-on** button fits the recommended bundle | **Not met.** Photo is never modified; simulated work interval is not AI processing |
| 4.2 Preferences and style | Minimal/Tailored defaults; deterministic rule-based ranking | Partial. Ranking uses built-in defaults with no visible preference input; no learned personal profile or AI engine |
| 4.2 Occasion | Everyday/Work/Weekend affects fixture ranking | Met locally; real catalogue semantics remain missing |
| 4.2 Color compatibility | Neutral garment colors and light/dark palette filtering | Partial. Neutral-only fixtures, no general color compatibility model |
| 4.2 Budget | Recommendations constrained to a numeric total budget | **Not met.** The builder no longer offers a budget input and coordinates from available pieces instead |
| 4.2 Coordinated combinations | Top/bottom/footwear, optional accessory; selected outerwear retained if chosen | Met for fixture catalogue; no AI generation |
| 4.2 Replace one item, retain the rest | Same-category alternatives constrained by availability and color | Met locally; unavailable alternatives produce feedback |
| 4.3 Connect catalogue and inventory | CSV or real read-only public/proxied HTTPS JSON API; validated preview, add/update or replace, tab storage and shared shop | Met for CSV and supported API snapshots; private credentialed adapters and automatic sync remain missing |
| 4.3 Verify availability and price before presentation | Imported stock and prices checked during generation/swaps/cart; the catalogue starts empty until a merchant imports or adds products | Met locally; no live inventory freshness or checkout-time server verification |
| 4.3 Suitable alternatives for unavailable items | Merchant alternatives panel filters same-category candidates by demo size availability; customer swaps additionally enforce availability/palette | Met for demo candidate review; no live inventory or automatic retailer substitution |
| 4.3 Bundle price | Total recalculated from selected items | Met locally; no currency/tax/discount rules from a retailer |
| 4.4 Catalogue/inventory APIs | HTTPS JSON test, validation, preview, confirmation, manual refresh, timeout/size limits and recovery | Met for public/CORS endpoints or credential-free backend proxies; not a secure private-platform connector |
| 4.4 Structured CSV import | Quoted CSV parser, validation, template, preview, atomic confirmation, merge/replace, persisted local catalogue | Met in browser; not server-backed or cross-device |
| 4.4 Different retailer schemas/platforms | No connector adapters or field mapping | **Not met** |
| 4.4 Embeddable widget | Standalone customer page only | Optional in this document; not implemented. A standalone preview does not prove embed capability |
| 4.5 Merchant dashboard | Catalogue, revenue preview and outfit affinity tables | Partial. Sample views only; not driven by real interaction or transaction data |
| 4.5 Frequent combinations and recommendation performance | Sample sessions, conversion and swap patterns | Partial presentation; no event collection or real aggregation |
| 4.5 Promotion opportunities / inventory utilization | Sample opportunity rows, stock-exception review | Partial. Suggested actions do not create promotions or prove inventory utilization |
| 6 Select garments, then recommend complementary products | Multi-select collection, removable chosen pieces and rule-generated complements preserving every chosen SKU | Met as a rule-based flow using sample/CSV/API data; no AI personalization |
| 6 Customer optional photo, edits, total | Photo optional, edits and total supported | Met as local interaction, not AI fitting |
| 6 Filter/replace unsuitable items before final recommendation | Rule engine filters stock and palette; returns explicit no-match rather than unsuitable recommendations | Met for fixtures; not synchronized with external inventory |
| 6 Retailer's existing checkout | Local cart review; checkout visibly unavailable | **Not met.** No native cart/checkout adapter; no simulated completed purchase |
| 6 Track interactions and sales when tracking is available | No tracking integration | Not connected; insights remain samples |
| 8 Controlled evaluation, baselines, real records | No experiments, event pipeline, processing logs or transaction records | **Not met** |
| 8 Distinguish projected benefits from validated results | Explicit demo disclosures; four sample merchant KPIs are not validated outcomes | Met in presentation, not empirical evaluation |

## Correct evaluation targets

These eight benchmarks are evaluation documentation, not merchant-facing dashboard cards. The dashboard shows recommendation-assisted sales, average assisted order value, multi-item assisted order share and recommendation engagement. Values are illustrative and disclosed once in the merchant footer; no transaction attribution or interaction tracking is connected. Conversion uplift and AI inference latency are not headline merchant KPIs.

| Section | Target | Required measurement |
|---|---|---|
| 7.1 Conversion | +10% **relative** purchase conversion | Treatment vs control purchase/session rates; `(treatment − control) / control` |
| 7.2 AOV | +10% AOV | Average transaction value relative to a suitable baseline/control |
| 7.3 Recommendation engagement | CTR ≥15% | Clicked/selected recommendations divided by displayed recommendations |
| 7.4 Availability accuracy | ≥98% | Verify recommended product against latest synchronized records |
| 7.5 Unavailable recommendations | <2% | Unfulfillable displayed products divided by verified recommendations |
| 7.6 Outfit discovery | −20% median assembly time | Comparable complete-outfit tasks, treatment vs individual browsing |
| 7.7 Virtual fitting | Median ≤5 seconds | Repeated **actual** model-processing tests under documented configuration |
| 7.8 Bundle sales | +10% **relative** multi-item purchase frequency | Multi-item transactions/all transactions, treatment vs control |

Catalogue availability is derived from known stock records, not the former hardcoded 99.2% indicator. Local availability is still not measured recommendation accuracy against a live synchronized source. AI processing latency belongs in technical evaluation, not merchant headline cards. A 1.2-second placeholder wait is not inference evidence.

## Scope cleanup performed

- Removed Widget Configuration, merchant blur controls and layout/contrast simulator: not requirements in this concept. The **optional embeddable widget itself remains in scope**, distinct from those settings.
- Removed the nonfunctional API-field setting; it never connected or mapped data. Real schema adaptation remains an unmet integration requirement.
- Removed the merchant toggle disabling stock substitution; suitable in-stock alternatives remain in scope.
- Removed CSV metric export, which is not requested here. **Structured catalogue CSV import is now implemented locally**—these are different features.
- Removed the manual “simulate sync error” developer control. Simulated catalogue synchronization remains explicitly demo-only.
- Recorded all eight documented benchmarks here. The merchant dashboard retains four sample operational KPIs without goal footers, per the user's subsequent direction.
- Removed misleading promotion “saved” confirmation; opportunity rows are now non-interactive advisory text, not buttons.
- Kept email/username-password demo login and visible logout because the user explicitly requested them separately. They are support functionality, not claimed AI/business capabilities. Authentication remains browser-only and insecure by production standards.
- Retained monochrome styling, rounded controls, accessible labels and responsive behavior as presentation choices, not added business scope.

## Practical next implementation order

1. Extend CSV/public API snapshots with authenticated backend persistence, credentialed platform adapters, retailer isolation and automatic inventory freshness.
2. Replace fixture preference/compatibility/availability rules with real catalogue semantics and personalized recommendations.
3. Actual virtual try-on service with suitable-photo handling and measured processing logs.
4. Native retailer cart/checkout handoff.
5. Tracking, transaction attribution and controlled evaluation against all eight targets.

## Latest page and inventory revision

- Added dedicated customer and merchant landing pages, with a customer outfit-builder entry point and merchant Home dashboard/Inventory dashboard entry points.
- The customer builder recommends inventory-aware complementary pieces and supports fitting. It has no size or budget inputs: chosen pieces are fixed constraints and the rule engine fills the missing categories from available stock. Fitting remains an original-photo preview, not generated virtual try-on.
- The merchant Inventory dashboard includes validated CSV/API imports, manual API refresh and opt-in 30-second/1-minute/5-minute refresh while the merchant tab is visible. Updates feed the customer catalogue in the same browser session. This partially addresses automatic inventory refresh; it does not provide server scheduling, private-platform adapters, cross-device persistence or checkout-time inventory verification.
- The default refresh mode is manual. Background updates skip open import forms, do not change the current page and retain the previous data on failure.
- The Inventory dashboard also supports manual product creation, metadata/price editing, unique size records and per-size stock adjustment. Product names open the editor, so there is no separate Action column. Duplicate product codes, invalid prices/sizes and negative or fractional stock are rejected. Removal requires confirmation; deleting the last product preserves an intentionally empty catalogue through refresh.
- Saving or deleting API-backed inventory requires acknowledgement of switching to manual management. The endpoint is removed and polling stops; retailer records are never written. Manual inventory persists in this browser tab and feeds the customer builder, not a shared server database.

No claim of improved sales, customer behavior, inventory accuracy or AI performance is justified until the respective integration and evaluation exists.
