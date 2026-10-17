import type { Dispatch, MutableRefObject, SetStateAction } from "react"
import type { Product } from "@/lib/catalogue"
import {
  catalogueSizes,
  productColor,
  productSizes,
  variantStock,
} from "@/lib/catalogue"
import type { Preferences } from "@/lib/recommend"
import { Button, Form, Heading, Input, Select } from "@/components/ui"
import { Icon, Garment } from "@/components/Icon"
import ProductImage from "@/components/ProductImage"
import type { BuilderMode, CartBundle, ShopIntent, ShopView } from "./types"

function PairingGraph({ items }: { items: Product[] }) {
  if (items.length < 2) return null
  const width = Math.max(320, items.length * 150)
  const y = 46
  return (
    <section className="panel pairing-graph" aria-label="How these pieces pair">
      <div className="panel-header">
        <div>
          <Heading level={2}>Pairing graph</Heading>
          <p>How the recommendation pairs each piece with the next.</p>
        </div>
      </div>
      <div className="pairing-scroll">
        <svg viewBox={`0 0 ${width} 120`} width={width} height={120} role="img"
          aria-label={items.map((p) => p.name).join(", paired with ")}>
          {items.slice(0, -1).map((_, i) => (
            <line key={i} x1={75 + i * 150} y1={y} x2={75 + (i + 1) * 150} y2={y}
              stroke="var(--border-strong)" strokeWidth="1.5" strokeDasharray="5 4" />
          ))}
          {items.map((p, i) => (
            <g key={p.sku}>
              <circle cx={75 + i * 150} cy={y} r={26} fill="var(--charcoal)" />
              <text x={75 + i * 150} y={y + 5} textAnchor="middle" fill="var(--surface)" fontSize={13} fontWeight={600}>
                {p.category.slice(0, 2).toUpperCase()}
              </text>
              <text x={75 + i * 150} y={y + 44} textAnchor="middle" fill="var(--muted)" fontSize={10}>
                {p.name.length > 20 ? `${p.name.slice(0, 20)}…` : p.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  )
}

export type OutfitPageProps = {
  products: Product[]
  image: string
  notify: (message: string) => void
  view: ShopView
  go: (view: ShopView) => void
  intent: ShopIntent
  setIntent: (intent: ShopIntent) => void
  builderMode: BuilderMode
  setBuilderMode: Dispatch<SetStateAction<BuilderMode>>
  selected: Product[]
  setSelected: Dispatch<SetStateAction<Product[]>>
  isSelected: (product: Product) => boolean
  togglePiece: (product: Product) => void
  category: string
  setCategory: (category: string) => void
  search: string
  setSearch: (search: string) => void
  prefs: Preferences
  updatePrefs: (patch: Partial<Preferences>) => void
  bundle: Product[]
  setBundle: Dispatch<SetStateAction<Product[]>>
  total: number
  error: string
  setError: (error: string) => void
  previewState: string
  setPreviewState: Dispatch<SetStateAction<string>>
  previewTimer: MutableRefObject<ReturnType<typeof setTimeout> | undefined>
  filtered: Product[]
  collectionPage: number
  setCollectionPage: Dispatch<SetStateAction<number>>
  openProduct: (product: Product) => void
  detailProduct: Product | undefined
  cart: CartBundle[]
  cartTotal: number
  selectedCartItems: number
  selectedCartBundles: number
  money: (amount: number) => string
  bundleSubtotal: (entry: CartBundle, selectedOnly?: boolean) => number
  canAddBundle: (items: Product[], size: string) => boolean
  changePieceQuantity: (id: string, sku: string, delta: number) => void
  selectCartPieces: (id: string, skus: string[]) => void
  removeBundle: (id: string) => void
  addCart: () => void
  quickAdd: (product: Product) => void
  swap: (product: Product, index: number) => void
  build: () => void
  photos: string[]
  activePhoto: number | null
  setActivePhoto: (index: number | null) => void
  activeModelSrc: string | null
  removePhoto: (index: number) => void
  upload: MutableRefObject<HTMLInputElement | null>
  preferencesExpanded: boolean
  setPreferencesExpanded: Dispatch<SetStateAction<boolean>>
}

export default function OutfitPage(props: OutfitPageProps) {
  const {
    products,
    image,
    notify,
    view,
    go,
    intent,
    setIntent,
    builderMode,
    setBuilderMode,
    selected,
    setSelected,
    isSelected,
    togglePiece,
    category,
    setCategory,
    search,
    setSearch,
    prefs,
    updatePrefs,
    bundle,
    setBundle,
    total,
    error,
    setError,
    previewState,
    setPreviewState,
    previewTimer,
    filtered,
    collectionPage,
    setCollectionPage,
    openProduct,
    detailProduct,
    cart,
    cartTotal,
    selectedCartItems,
    selectedCartBundles,
    money,
    bundleSubtotal,
    canAddBundle,
    changePieceQuantity,
    selectCartPieces,
    removeBundle,
    addCart,
    quickAdd,
    swap,
    build,
    photos,
    activePhoto,
    setActivePhoto,
    activeModelSrc,
    removePhoto,
    upload,
    preferencesExpanded,
    setPreferencesExpanded,
  } = props
  const collectionPages = Math.max(1, Math.ceil(filtered.length / 12))
  const outfitRows = (
    <div className="outfit-items">
      {bundle.map((p, index) => (
        <div className="studio-item" key={p.sku}>
          <div className="studio-item-image">
            <ProductImage product={p} Garment={Garment} />
          </div>
          <div>
            <span className="tiny-label">
              {p.category}
              {isSelected(p) ? " · Your selection" : ""}
            </span>
            <strong>{p.name}</strong>
            <small>
              {productColor(p)} · Size {prefs.size} ·{" "}
              {variantStock(p, prefs.size)} catalogue units
            </small>
            <span className="item-price">₱{p.price.toFixed(2)}</span>
          </div>
          <Button
            className="icon-button"
            aria-label={`Swap ${p.name}`}
            onClick={() => swap(p, index)}
          >
            <Icon name="swap" />
            <span>Swap</span>
          </Button>
        </div>
      ))}
    </div>
  )
  return (
    <>
      <div className="customer-intro">
        <Heading level={1}>
          {view === "collection"
            ? intent === "purchase" ? "Shop pieces" : "Outfit builder"
            : view === "product"
              ? "Product details"
              : view === "cart"
                ? "Your cart"
                : view === "fitting"
                  ? "Fitting studio"
                  : "Your outfit"}
        </Heading>
      </div>
      {view === "collection" && (
        <>
          <div className="builder-studio">
            <div className="builder-model">
              <div className="fitting-canvas">
                <img
                  className={activeModelSrc ? undefined : "full-body-model"}
                  src={activeModelSrc || image}
                  alt={
                    activeModelSrc
                      ? "Your uploaded model photo, not AI rendered"
                      : "Full-body fashion model wearing a black dress, gold belt and heeled boots, not AI rendered"
                  }
                />
                <span className="canvas-label">
                  {intent === "purchase" ? "Collection preview" : "Model fitter · preview"}
                </span>
                {!activeModelSrc && (
                  <span className="model-credit">
                    Ola Szkolda / Unsplash
                  </span>
                )}
                {bundle.length > 0 && intent === "builder" && (
                  <div className="complete-look" aria-label="Complete look">
                    <strong>Complete look · {bundle.length} {bundle.length === 1 ? "piece" : "pieces"} · {money(total)}</strong>
                    <div>
                      {bundle.map((p) => (
                        <span key={p.sku} className="complete-chip">{p.category} · {p.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {previewState === "loading" && (
                  <div className="inference-skeleton" role="status">
                    <div className="skeleton-block" />
                    <strong>Preparing preview…</strong>
                    <span>AI garment rendering is not connected.</span>
                  </div>
                )}
              </div>
              <div className="model-thumbs" aria-label="Choose a model">
                <button
                  className={`model-thumb ${activePhoto === null ? "selected" : ""}`}
                  onClick={() => setActivePhoto(null)}
                  aria-pressed={activePhoto === null}
                >
                  <img src={image} alt="Default studio model" />
                  <span>Studio</span>
                </button>
                {photos.map((src, i) => (
                  <div key={src} className={`model-thumb ${activePhoto === i ? "selected" : ""}`}>
                    <button onClick={() => setActivePhoto(i)} aria-pressed={activePhoto === i} aria-label={`Fit on uploaded model ${i + 1}`}>
                      <img src={src} alt={`Uploaded model ${i + 1}`} />
                    </button>
                    <span>Model {i + 1}</span>
                    <Button className="icon-button model-remove" aria-label={`Remove model ${i + 1}`} onClick={() => removePhoto(i)}>
                      <Icon name="close" />
                    </Button>
                  </div>
                ))}
                <button className="model-thumb model-upload" onClick={() => upload.current?.click()}>
                  <Icon name="upload" />
                  <span>Upload photo</span>
                </button>
              </div>
            </div>
            <div className="builder-side">
              <div className="builder-nav">
                {intent === "purchase" ? (
                  <div className="segmented" aria-label="Shopping mode">
                    <Button className="selected" aria-pressed={true} onClick={() => setIntent("purchase")}>Purchase</Button>
                    <Button aria-pressed={false} onClick={() => { setIntent("builder"); setError("") }}>Builder</Button>
                  </div>
                ) : (
                  <div className="segmented" aria-label="Builder mode">
                    {(["single", "bundle"] as const).map((mode) => (
                      <Button key={mode} className={builderMode === mode ? "selected" : ""}
                        aria-pressed={builderMode === mode} onClick={() => {
                          setBuilderMode(mode)
                          if (mode === "single") setSelected(current => current.slice(0, 1))
                          setBundle([])
                          setError("")
                        }}>{mode === "single" ? "Single piece" : "Outfit bundle"}</Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="shop-toolbar builder-block">
                {intent === "purchase" && (
                  <label className="purchase-size">
                    Size
                    <Select
                      value={prefs.size}
                      onChange={(e) => updatePrefs({ size: e.target.value })}
                    >
                      {catalogueSizes(products).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  </label>
                )}
                <div className="shop-categories" aria-label="Product categories">
                  {[
                    "All",
                    "Top",
                    "Bottom",
                    "Outerwear",
                    "Footwear",
                    "Accessory",
                  ].map((c) => (
                    <Button
                      key={c}
                      className={c === category ? "selected" : ""}
                      aria-pressed={c === category}
                      onClick={() => setCategory(c)}
                    >
                      {c === "All" ? "All pieces" : c}
                    </Button>
                  ))}
                </div>
                <div className="catalogue-search">
                  <Icon name="search" />
                  <Input
                    aria-label="Search clothing"
                    placeholder="Find a piece"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div
                className={`shopping-layout ${
                  selected.length ? "has-selection" : ""
                }`}
              >
                <section className="shop-grid" aria-label="Product collection">
                  {filtered
                    .slice((collectionPage - 1) * 12, collectionPage * 12)
                    .map((p) => (
                      <article
                        className={`shop-product ${
                          isSelected(p) ? "chosen" : ""
                        }`}
                        key={p.sku}
                      >
                        <Button
                          className="shop-product-art"
                          aria-label={`View ${p.name}`}
                          onClick={() => openProduct(p)}
                        >
                          <ProductImage product={p} Garment={Garment} />
                          <span className="product-art-label">
                            {!p.stock
                              ? "Unavailable"
                              : isSelected(p)
                                ? "Selected"
                                : ""}
                          </span>
                        </Button>
                        <div className="shop-product-info">
                          <div>
                            <span>{p.category}</span>
                            <Heading level={3}>
                              <Button className="product-name-link" onClick={() => openProduct(p)}>{p.name}</Button>
                            </Heading>
                            <small>
                              {productColor(p)}
                              {!p.stock && " · Out of stock"}
                            </small>
                          </div>
                          <strong>₱{p.price.toLocaleString("en-PH")}</strong>
                        </div>
                        {intent === "purchase" ? (
                          <Button
                            className="button primary product-outfit-action"
                            disabled={!variantStock(p, prefs.size)}
                            onClick={() => quickAdd(p)}
                          >
                            <Icon name="bag" />
                            Add to cart · {prefs.size}
                          </Button>
                        ) : (
                          <Button
                            className={`button ${isSelected(p) ? "secondary" : "primary"} product-outfit-action`}
                            disabled={!p.stock}
                            aria-pressed={isSelected(p)}
                            onClick={() => togglePiece(p)}
                          >
                            <Icon name={isSelected(p) ? "close" : "plus"} />
                            {isSelected(p) ? "Remove from outfit" : "Add to outfit"}
                          </Button>
                        )}
                      </article>
                    ))}
                  {!filtered.length && (
                    <div className="empty">
                      No pieces match. Try another search or category.
                    </div>
                  )}
                </section>
              </div>
              {collectionPages > 1 && (
                <div className="collection-pagination">
                  <span aria-live="polite">
                    {filtered.length} pieces · Page {collectionPage} of{" "}
                    {collectionPages}
                  </span>
                  <div>
                    <Button
                      className="button secondary"
                      disabled={collectionPage === 1}
                      onClick={() => {
                        setCollectionPage((current) => current - 1)
                        window.scrollTo(0, 0)
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      className="button secondary"
                      disabled={collectionPage >= collectionPages}
                      onClick={() => {
                        setCollectionPage((current) => current + 1)
                        window.scrollTo(0, 0)
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              {bundle.length > 1 && intent === "builder" && (
                <PairingGraph items={bundle} />
              )}
              {intent === "builder" && (
                <aside
                  className={`shop-preferences builder-block builder-setting-full ${preferencesExpanded ? "sheet-expanded" : ""}`}
                  aria-label="Outfit preferences"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setPreferencesExpanded(false)
                      document.getElementById("preferences-sheet-toggle")?.focus()
                    }
                  }}
                >
                  <div className="preferences-heading">
                    <Heading level={2}>
                      Setting{" "}
                      <span className="catalogue-count">{selected.length}</span>
                    </Heading>
                    <Button
                      className="icon-button"
                      aria-label="Clear selected pieces"
                      onClick={() => {
                        setSelected([])
                        setBundle([])
                        setError("")
                      }}
                    >
                      <Icon name="close" />
                    </Button>
                  </div>
                  <Button id="preferences-sheet-toggle" className="button secondary sheet-toggle"
                    aria-expanded={preferencesExpanded} aria-controls="builder-preferences-body"
                    onClick={() => setPreferencesExpanded((current) => !current)}>
                    {preferencesExpanded ? "Collapse preferences" : "Set preferences"}
                    <Icon name="settings" />
                  </Button>
                  <div className="preference-sheet-body" id="builder-preferences-body">
                    <Form
                      onSubmit={(e) => {
                        e.preventDefault()
                        build()
                      }}
                    >
                      <div className="preference-fields">
                        <label>
                          Style
                          <Select
                            value={prefs.style}
                            onChange={(e) =>
                              updatePrefs({ style: e.target.value })
                            }
                          >
                            <option>Minimal</option>
                            <option>Tailored</option>
                          </Select>
                        </label>
                        <label>
                          Occasion
                          <Select
                            value={prefs.occasion}
                            onChange={(e) =>
                              updatePrefs({ occasion: e.target.value })
                            }
                          >
                            <option>Everyday</option>
                            <option>Work</option>
                            <option>Weekend</option>
                          </Select>
                        </label>
                        <label>
                          Size
                          <Select
                            value={prefs.size}
                            onChange={(e) =>
                              updatePrefs({ size: e.target.value })
                            }
                          >
                            {catalogueSizes(products).map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </Select>
                        </label>
                        <label>
                          Outfit budget (₱)
                          <Input
                            type="number"
                            min="1"
                            max="100000"
                            step="1"
                            required
                            value={prefs.budget || ""}
                            onChange={(e) =>
                              updatePrefs({ budget: Number(e.target.value) })
                            }
                          />
                        </label>
                        <label className="full-field">
                          Color preference
                          <Select
                            value={prefs.palette}
                            onChange={(e) =>
                              updatePrefs({ palette: e.target.value })
                            }
                          >
                            <option>Any color</option>
                            <option>Light neutrals</option>
                            <option>Dark neutrals</option>
                          </Select>
                        </label>
                      </div>
                      {builderMode === "bundle" && <label className="accessory-choice">
                        <Input
                          type="checkbox"
                          checked={
                            prefs.accessories ||
                            selected.some((p) => p.category === "Accessory")
                          }
                          disabled={selected.some(
                            (p) => p.category === "Accessory",
                          )}
                          onChange={(e) =>
                            updatePrefs({ accessories: e.target.checked })
                          }
                        />
                        Include an accessory
                      </label>}
                      <div className="preference-models">
                        <span role="status">{photos.length ? `${photos.length} uploaded model${photos.length === 1 ? "" : "s"} ready` : "Studio model in use"}</span>
                      </div>
                      {error && (
                        <div className="shop-error" role="alert">
                          {error}
                        </div>
                      )}
                    </Form>
                  </div>
                </aside>
              )}
              <section className="builder-actions" aria-label="Actions">
                {intent === "purchase" ? (
                  <p className="shop-demo-note">Add pieces to your cart above, then review them in the cart.</p>
                ) : (
                  <div className="builder-buttons">
                    <Button className="button primary" disabled={!selected.length} onClick={build}>
                      Generate Outfit <Icon name="arrow" />
                    </Button>
                    <Button className="button secondary" disabled={!bundle.length} onClick={addCart}>
                      <Icon name="bag" />
                      Add to Cart
                    </Button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
      {view === "product" && (
        <>
          <Button className="text-button product-back" onClick={() => go("collection")}>
            Back to collection
          </Button>
          {detailProduct ? (
            <section className="product-detail-layout">
              <div className="product-detail-art">
                <ProductImage product={detailProduct} Garment={Garment} />
              </div>
              <div className="product-detail-info">
                <span className="eyebrow">{detailProduct.category}</span>
                <Heading level={2}>{detailProduct.name}</Heading>
                <strong className="product-detail-price">₱{detailProduct.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>
                <p>Build your look around this piece, or pair it with complementary items from the collection.</p>
                <dl className="product-specifications">
                  <div><dt>Color</dt><dd>{productColor(detailProduct)}</dd></div>
                  <div><dt>Product code</dt><dd>{detailProduct.sku}</dd></div>
                  <div><dt>Availability</dt><dd>{detailProduct.stock ? `${detailProduct.stock} units available` : "Out of stock"}</dd></div>
                </dl>
                <label className="product-size-label">
                  Size
                  <Select value={prefs.size} onChange={(e) => updatePrefs({ size: e.target.value })}>
                    {!productSizes(detailProduct).includes(prefs.size) && <option value={prefs.size} disabled>{prefs.size} — unavailable</option>}
                    {productSizes(detailProduct).map((size) => (
                      <option key={size} value={size} disabled={!variantStock(detailProduct, size)}>
                        {size}{!variantStock(detailProduct, size) ? " — unavailable" : ""}
                      </option>
                    ))}
                  </Select>
                </label>
                <Button
                  className={`button ${isSelected(detailProduct) ? "secondary" : "primary"} full`}
                  disabled={!isSelected(detailProduct) && !variantStock(detailProduct, prefs.size)}
                  onClick={() => {
                    togglePiece(detailProduct)
                    notify(isSelected(detailProduct) ? "Piece removed from your outfit." : "Piece added to your outfit.")
                  }}
                >
                  <Icon name={isSelected(detailProduct) ? "close" : "plus"} />
                  {isSelected(detailProduct) ? "Remove from outfit" : "Add to outfit"}
                </Button>
                <Button className="button secondary full"
                  disabled={!variantStock(detailProduct, prefs.size)}
                  onClick={() => {
                    setBuilderMode("single")
                    setSelected([detailProduct])
                    setBundle([detailProduct])
                    setError("")
                    setPreviewState("idle")
                    go("fitting")
                  }}>
                  Fit this piece <Icon name="arrow" />
                </Button>
                {error && <p className="shop-error" role="alert">{error}</p>}
                <Button className="button secondary full" onClick={() => go("collection")}>
                  {selected.length ? `Style my ${selected.length} selected pieces` : "Continue shopping"}
                  <Icon name="arrow" />
                </Button>
                <small className="shop-demo-note">Size applies to your coordinated outfit. Add pieces, then set your preferences in the collection.</small>
              </div>
            </section>
          ) : (
            <div className="empty"><Heading level={2}>This product is no longer available</Heading></div>
          )}
        </>
      )}
      {view === "cart" && (
        <section className={`shop-cart ${selectedCartItems ? "" : "without-summary"}`}>
          {cart.length ? (
            <>
              <div className="cart-bundles">
                {cart.map((entry, index) => (
                  <section className="cart-bundle" key={entry.id}>
                    <div className="cart-bundle-heading">
                      <Input
                        type="checkbox"
                        className="cart-checkbox"
                        aria-label={`Select all pieces in outfit ${index + 1}`}
                        checked={entry.selectedSkus.length === entry.items.length}
                        ref={(input) => {
                          if (input) input.indeterminate = entry.selectedSkus.length > 0 && entry.selectedSkus.length < entry.items.length
                        }}
                        onChange={(e) => selectCartPieces(entry.id, e.target.checked ? entry.items.map((p) => p.sku) : [])}
                      />
                      <div>
                        <Heading level={2}>Outfit {index + 1}</Heading>
                        <small>{entry.style} · {entry.occasion} · Size {entry.size} · {entry.items.length} pieces</small>
                      </div>
                      <Button className="icon-button" aria-label={`Remove outfit ${index + 1}`} onClick={() => removeBundle(entry.id)}>
                        <Icon name="trash" />
                      </Button>
                    </div>
                    <div className="cart-items">
                      {entry.items.map((p) => (
                        <div className="cart-item" key={p.sku}>
                          <Input
                            type="checkbox"
                            className="cart-checkbox"
                            aria-label={`Select ${p.name} in outfit ${index + 1}`}
                            checked={entry.selectedSkus.includes(p.sku)}
                            onChange={(e) => selectCartPieces(entry.id, e.target.checked
                              ? [...entry.selectedSkus, p.sku]
                              : entry.selectedSkus.filter((sku) => sku !== p.sku))}
                          />
                          <div className="studio-item-image">
                            <ProductImage product={p} Garment={Garment} />
                          </div>
                          <div>
                            <strong>{p.name}</strong>
                            <small>
                              Size {entry.size} · {productColor(p)} · {money(p.price)} each
                            </small>
                          </div>
                          <div className="cart-piece-controls">
                            <div className="bundle-quantity">
                              <Button className="icon-button" aria-label={`Decrease ${p.name} quantity in outfit ${index + 1}`} disabled={entry.quantities[p.sku] === 1} onClick={() => changePieceQuantity(entry.id, p.sku, -1)}>−</Button>
                              <strong aria-live="polite">{entry.quantities[p.sku]}</strong>
                              <Button className="icon-button" aria-label={`Increase ${p.name} quantity in outfit ${index + 1}`} disabled={!canAddBundle([p], entry.size)} onClick={() => changePieceQuantity(entry.id, p.sku, 1)}><Icon name="plus" /></Button>
                            </div>
                            <strong>{money(p.price * entry.quantities[p.sku])}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="cart-bundle-footer">
                      <span>Bundle subtotal</span>
                      <strong>{money(bundleSubtotal(entry))}</strong>
                    </div>
                  </section>
                ))}
              </div>
              {selectedCartItems > 0 && <aside className="cart-summary">
                <Heading level={2}>Order summary</Heading>
                <div className="cart-summary-counts"><span>From {selectedCartBundles} {selectedCartBundles === 1 ? "outfit" : "outfits"}</span><span>{selectedCartItems} selected pieces</span></div>
                <div>
                  <span>Subtotal</span>
                  <strong>{money(cartTotal)}</strong>
                </div>
                <p>Shipping and taxes will be calculated by the retailer.</p>
                <Button className="button primary full" disabled>
                  Retailer checkout unavailable
                </Button>
              </aside>}
            </>
          ) : (
            <div className="empty">
              <Heading level={2}>Your cart is empty</Heading>
              <Button
                className="button primary"
                onClick={() => go("collection")}
              >
                Browse the collection
                <Icon name="arrow" />
              </Button>
            </div>
          )}
        </section>
      )}
      {(view === "outfit" || view === "fitting") && (
        <>
          <div className="outfit-context">
            <div className="outfit-context-pieces">
              <span className="outfit-context-label">Your selected pieces</span>
              <div className="outfit-piece-tags">
                {selected.map((p) => <span className="outfit-piece-tag" key={p.sku}>{p.name}</span>)}
              </div>
            </div>
            <Button className="button secondary outfit-context-edit" onClick={() => go("collection")}>
              Edit preferences
              <Icon name="settings" />
            </Button>
            <dl className="outfit-preference-summary">
              {[
                ["Style", prefs.style],
                ["Occasion", prefs.occasion],
                ["Size", prefs.size],
                ["Budget", `₱${prefs.budget.toLocaleString("en-PH")}`],
              ].map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </div>
          {view === "outfit" ? (
            <div className="recommended-layout">
              <div
                className="outfit-composition"
                aria-label="Recommended coordinated outfit"
              >
                {bundle.map((p) => (
                  <div
                    className={`composition-piece composition-${p.category.toLowerCase()}`}
                    key={p.sku}
                  >
                    <ProductImage product={p} Garment={Garment} />
                    <span>
                      {p.category} / {productColor(p)}
                    </span>
                  </div>
                ))}
              </div>
              <PairingGraph items={bundle} />
              <section className="outfit-tray">
                <span className="eyebrow">BUILT AROUND YOUR PIECE</span>
                <Heading level={2}>
                  {bundle.length === 1 ? "Your selected piece" : "Your coordinated edit"}
                  <span className="look-count">{bundle.length} pieces</span>
                </Heading>
                {outfitRows}
                <Button
                  className="button secondary full"
                  onClick={() => go("fitting")}
                >
                  Try the fitting studio
                  <Icon name="arrow" />
                </Button>
              </section>
            </div>
          ) : (
            <div className="studio-layout">
              <div className="fitting-model">
                <div className="fitting-canvas">
                  <img
                    className={activeModelSrc ? undefined : "full-body-model"}
                    src={activeModelSrc || image}
                    alt={
                      activeModelSrc
                        ? "Your uploaded model photo, not AI rendered"
                        : "Full-body fashion model wearing a black dress, gold belt and heeled boots, not AI rendered"
                    }
                  />
                  <span className="canvas-label">
                    Complete model · fitted preview
                  </span>
                  {!activeModelSrc && (
                    <span className="model-credit">
                      Ola Szkolda / Unsplash
                    </span>
                  )}
                  {bundle.length > 0 && (
                    <div className="complete-look" aria-label="Complete model with fitted clothing">
                      <strong>Fitted on model · {bundle.length} {bundle.length === 1 ? "piece" : "pieces"} · {money(total)}</strong>
                      <div>
                        {bundle.map((p) => (
                          <span key={p.sku} className="complete-chip">{p.category} · {p.name} · {prefs.size}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {previewState === "loading" && (
                    <div className="inference-skeleton" role="status">
                      <div className="skeleton-block" />
                      <strong>Preparing preview…</strong>
                      <span>AI garment rendering is not connected.</span>
                    </div>
                  )}
                </div>
              </div>
              <section className="outfit-tray">
                <Heading level={2}>{bundle.length === 1 ? "Fit a single piece" : "Fit your outfit bundle"}</Heading>
                {outfitRows}
                <Button
                  className="button primary full"
                  disabled={previewState === "loading"}
                  onClick={() => {
                    setPreviewState("loading")
                    previewTimer.current = setTimeout(
                      () => setPreviewState("ready"),
                      1200,
                    )
                  }}
                >
                  {previewState === "loading"
                    ? "Preparing…"
                    : bundle.length === 1 ? "Preview piece" : "Preview outfit"}
                </Button>
                <p className="studio-disclaimer" role="status">
                  {previewState === "ready"
                    ? "Preview complete. Original image unchanged; no AI rendering."
                    : "Optional local photo preview. Photos are not sent to a server."}
                </p>
                <div className="model-thumbs fitting-thumbs" aria-label="Choose a model">
                  <button
                    className={`model-thumb ${activePhoto === null ? "selected" : ""}`}
                    onClick={() => setActivePhoto(null)}
                    aria-pressed={activePhoto === null}
                  >
                    <img src={image} alt="Default studio model" />
                    <span>Studio</span>
                  </button>
                  {photos.map((src, i) => (
                    <button key={src} className={`model-thumb ${activePhoto === i ? "selected" : ""}`}
                      onClick={() => setActivePhoto(i)} aria-pressed={activePhoto === i}>
                      <img src={src} alt={`Uploaded model ${i + 1}`} />
                      <span>Model {i + 1}</span>
                    </button>
                  ))}
                  <button className="model-thumb model-upload" onClick={() => upload.current?.click()}>
                    <Icon name="upload" />
                    <span>Upload photo</span>
                  </button>
                </div>
              </section>
            </div>
          )}
          <div className="checkout-dock blur-16">
            <small>{bundle.length} ITEMS</small>
            <div>
              <strong>{money(total)}</strong>
              <Button className="button primary" onClick={addCart}>
                <Icon name="bag" />
                {bundle.length === 1 ? "Add piece to cart" : "Add outfit to cart"}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
