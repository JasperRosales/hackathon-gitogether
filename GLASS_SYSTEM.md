# Forma — light vibrancy system

This is the implementation guide for the Apple-inspired redesign. `src/index.css` is the executable token sheet. This guide supersedes older opaque-card / charcoal-navigation styling notes in `DESIGN_SYSTEM.md`; application capabilities and integration constraints are unchanged.

## 1. Tokens and material hierarchy

| Token | Value / behavior |
|---|---|
| `--surface`, canvas | `#FFFFFF`; the application backdrop is pure white |
| `--background` | `#F9F9FA`; preview wells, table headings, quiet inset regions |
| `--surface-subtle` | `#F2F2F4`; selected support elements and skeleton frames |
| `--material-thin` | `rgba(255,255,255,.65)` |
| `--blur-thin`, `--saturation-thin` | `20px`, `180%` |
| `--material-regular` | `rgba(255,255,255,.80)` |
| `--blur-regular`, `--saturation-regular` | `35px`, `190%` |
| `--material-elevated` | `rgba(255,255,255,.92)` |
| `--blur-elevated`, `--saturation-elevated` | `50px`, `200%` |
| `--material-data` | `rgba(255,255,255,.95)`; tables and status footers have no backdrop blur |
| `--vibrancy-thin/regular/elevated` | Composed `blur(...) saturate(...)` filter values |
| `--ink` | `#000000`; primary text and numerical data |
| `--muted` | `rgba(0,0,0,.60)`; secondary labels and metadata |
| `--disabled-ink` | `rgba(0,0,0,.38)`; disabled-only semantic token, never readable metadata |
| `--border` | `1px` hairline using `rgba(0,0,0,.07)`; decorative surface separation |
| `--border-strong` | `rgba(0,0,0,.48)`; input boundaries, selected products, error and focus-support regions |
| `--specular-highlight` | `inset 0 1px 1px 0 rgba(255,255,255,.90)` |
| `--shadow-ambient` | `0 4px 16px -2px rgba(0,0,0,.04)` |
| `--shadow-elevated` | `0 12px 40px -8px rgba(0,0,0,.12)` |
| `--elevation` | Specular inset + elevated shadow |
| `--radius`, `--radius-soft`, `--radius-pill` | `12px`, `20px`, `999px`; insets, cards, controls |
| `--motion`, `--motion-ease` | `160ms`, `ease-out`; no springs, tilt, or decorative glow |
| `--control-small/medium/large` | `36px / 40px / 44px`; utility, desktop, primary/touch controls |
| `--header-height`, `--dock-height` | `64px / 88px`; reserved navigation/action geometry |
| `--sidebar-expanded/collapsed` | `216px / 80px`; labelled utility panel / icon rail |
| `--inspection-loading-height` | `360px`; reserved lazy inspection loading frame |

The existing spacing scale remains `4 / 8 / 12 / 16 / 24 / 32px`. Inter is the interface typeface; only the Forma identity retains editorial serif styling. Numerical metrics and monetary totals use tabular numerals.

### Contrast rules

- Black on white is 21:1. The 60% black label token composites to `#666666` on white, approximately 5.74:1.
- Metadata is placed on white / near-white neutral substrates, never directly on busy photos. Photo labels use an elevated white capsule.
- The 38% black token does **not** meet 4.5:1 on white. It is restricted to inactive controls, which are contrast-exempt; it must not be substituted for normal secondary copy.
- The 7% hairline is decorative, not the sole indication of an interactive boundary. Inputs use the stronger neutral boundary and a black, offset focus ring.
- Contrast must be checked again if a darker preview/background is introduced beneath a material. No claim of a complete WCAG audit is made by these token ratios alone.

## 2. Component transformation guide

| Component | Before | After / implementation rule |
|---|---|---|
| Customer header | Full-width flat header | Floating thin-material pill, sticky below a 16px top inset; logo, cart and account controls only |
| Merchant navigation | Charcoal icon capsule | Thin white glass rail with labelled destinations; collapse control reduces to icons with tooltips; active state uses opaque white selection |
| Cards / KPI modules | Opaque white or charcoal cards | Regular material + specular top edge + ambient shadow; black metrics, dark labels and compact illustrative delta capsules |
| Data tables | Flat bordered regions | 95% white data surface, no blur in the scroll area; dense rows, restrained header fill, consistent tabular alignment |
| Inputs | Generic rounded boxes | Nearly opaque white insets; stronger accessible neutral boundaries, 40px standard height and black focus-visible ring |
| Segmented pills | Flat grey track | Thin material track, black selected capsule, text/pressed state maintained independently of colour |
| Customer selection panel | Static mobile stack / sticky desktop card | Regular glass desktop inspector; expandable non-modal bottom sheet on mobile |
| Outfit tray / cart bundle | Unframed lists | Regular-material groups with opaque preview thumbnails, readable item metadata and discrete quantity controls |
| Bottom action bar | In-flow horizontal strip | Fixed elevated-glass dock; count on the left, total and black pill action grouped on the right; document reserves dock space |
| Toast | Dark solid rectangle | Elevated white capsule; black status text and icons, placed above any bottom action dock |
| Import / inspection panel | Flat bordered card | Elevated glass around solid content; validation and confirmation remain explicit |
| Preview / model image | Shared flat panel | Neutral opaque preview well; photo and garment imagery remain unfiltered and uncropped where appropriate |
| Loading frame | Plain status text | Crisp neutral fixed-geometry skeleton in the existing preview; lazy inspection frame reserves a minimum height |

No new operational claims are implied by the visual change. KPI deltas remain illustrative and share the merchant footer’s sample-data disclosure. `pp` denotes percentage points, not relative growth.

## 3. Responsive behavior

### Desktop

- Customer selection stays in a sticky split-pane inspector below the floating header. The studio uses a neutral image pane and a glass item inspector.
- Merchant navigation can expand or collapse with a keyboard-accessible button. `aria-expanded` and `aria-controls` describe the state; the active destination retains `aria-current`.
- Four KPI columns reduce to two below 950px. Operational tables scroll within their own opaque region rather than hiding columns.
- Customer action dock is fixed, not nested in a transformed parent. Main content reserves its height plus bottom spacing.

### Mobile

- At 700px and below, the builder preference inspector becomes a non-modal bottom sheet. The collapsed sheet exposes the selected-piece count and “Set preferences”; expanding reveals the scrollable form.
- The sheet has a 72dvh maximum height. It does not lock page scroll or trap focus because it is not modal. Collapsing hides its controls from keyboard navigation. Escape collapses it and returns focus to its trigger.
- Single-column studio and product views retain clear image-first hierarchy. The cart summary follows bundle content instead of sticking.
- At 650px and below, merchant navigation becomes a detached thin-glass bottom capsule. The desktop collapse control is hidden; all destinations remain available by icon and accessible name.
- Bottom docks and navigation include `env(safe-area-inset-bottom)`. Content padding prevents the last row/action from being covered.

## 4. Edge and accessibility states

| State | Required behavior |
|---|---|
| Empty | Neutral inset frame, readable explanation and relevant recovery action; no fake data |
| Loading | Keep the image/preview geometry fixed; skeleton overlays the existing canvas. Disable the initiating action without changing button dimensions. Lazy inspection uses a reserved frame; intentional expansion of completed content is not advertised as zero global CLS |
| Error | Preserve previous inventory; opaque validation content, black text and a stronger neutral border; errors are also announced by existing alert/status semantics |
| Selected | Black/white capsule, checkbox state or explicit label; never glass tint alone |
| Partial bundle selection | Native indeterminate checkbox, independent piece selections and selected-only order totals |
| Disabled | Non-interactive control remains visibly distinct; disabled contrast exemption does not apply to normal metadata |
| Keyboard focus | Visible 2px black ring with 4px offset. No clipping by the navigation rail or outline removal without a parent focus ring |
| Reduced motion | All transitions and animations disabled |
| Reduced transparency | Materials become solid white and all material filters resolve to `none` |
| Unsupported backdrop filter | Solid-white fallback surfaces |
| Forced colours | System CanvasText surface boundaries and Highlight focus rings; no dependence on shadows |

Apple-like depth is a material hierarchy, not decoration: no rainbow gradients, textured blur behind table values, 3D hover tilt, or bouncy springs. The customer experience prioritizes manipulation and selection; the merchant console prioritizes density, comparison and rapid scanning.
