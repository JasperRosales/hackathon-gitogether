import type { Dispatch, MutableRefObject, SetStateAction } from "react"
import type { Product } from "@/lib/catalogue"
import { productColor } from "@/lib/catalogue"
import { Button, Heading, Input } from "@/components/ui"
import { Icon, Garment } from "@/components/Icon"
import ProductImage from "@/components/ProductImage"
import type { CartBundle, ShopView } from "./types"

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
  selected: Product[]
  setSelected: Dispatch<SetStateAction<Product[]>>
  isSelected: (product: Product) => boolean
  togglePiece: (product: Product) => void
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
  canAddBundle: (items: Product[]) => boolean
  changePieceQuantity: (id: string, sku: string, delta: number) => void
  selectCartPieces: (id: string, skus: string[]) => void
  removeBundle: (id: string) => void
  addCart: () => void
  addCartItem: (product: Product) => void
  swap: (product: Product, index: number) => void
  photos: string[]
  activePhoto: number | null
  setActivePhoto: (index: number | null) => void
  activeModelSrc: string | null
  removePhoto: (index: number) => void
  upload: MutableRefObject<HTMLInputElement | null>
  photoReco: { status: "idle" | "loading" | "error"; warnings: string[]; error: string; note: string }
  photoConfigured: boolean
  hasModelPhoto: boolean
  runPhotoRecommendation: () => void
  signedIn: boolean
  onRequireLogin: () => void
}

export default function OutfitPage(props: OutfitPageProps) {
  const {
    products,
    image,
    notify,
    view,
    go,
    selected,
    setSelected,
    isSelected,
    togglePiece,
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
    addCartItem,
    swap,
    photos,
    activePhoto,
    setActivePhoto,
    activeModelSrc,
    removePhoto,
    upload,
    photoReco,
    photoConfigured,
    hasModelPhoto,
    runPhotoRecommendation,
    signedIn,
    onRequireLogin,
  } = props
  const openFitting = () => {
    if (!signedIn) {
      onRequireLogin()
      return
    }
    go("fitting")
  }
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
            <small>{productColor(p)} · {p.stock} catalogue units</small>
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
            ? "Outfit builder"
            : view === "product"
              ? "Product details"
              : view === "cart"
                ? "Your cart"
                : "Fitting studio"}
        </Heading>
      </div>
      {view === "collection" && (
        <div className="builder-studio">
          <div className="builder-model">
            <div className="fitting-canvas">
              <img
                loading="lazy"
                decoding="async"
                className={activeModelSrc ? undefined : "full-body-model"}
                src={activeModelSrc || image}
                alt={
                  activeModelSrc
                    ? "Your uploaded model photo, not AI rendered"
                    : "Full-body fashion model wearing a black dress, gold belt and heeled boots, not AI rendered"
                }
              />
              <span className="canvas-label">Model fitter · preview</span>
              {!activeModelSrc && (
                <span className="model-credit">Ola Szkolda / Unsplash</span>
              )}
              {bundle.length > 0 && (
                <div className="complete-look" aria-label="Complete look">
                  <strong>Recommended look · {bundle.length} {bundle.length === 1 ? "piece" : "pieces"} · {money(total)}</strong>
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
                  <strong>Preparing try-on…</strong>
                  <span>AI garment rendering is not connected.</span>
                </div>
              )}
            </div>
            <Button
              className="button primary full"
              disabled={previewState === "loading" || !bundle.length}
              onClick={() => {
                setPreviewState("loading")
                previewTimer.current = setTimeout(() => setPreviewState("ready"), 1200)
              }}
            >
              <Icon name="layers" />
              {previewState === "loading"
                ? "Preparing try-on…"
                : bundle.length
                  ? `Virtual try-on · ${bundle.length} ${bundle.length === 1 ? "piece" : "pieces"}`
                  : "Virtual try-on"}
            </Button>
            <p className="studio-disclaimer" role="status">
              {!bundle.length
                ? "Add one or more pieces and the try-on fits the recommended look on this model."
                : activeModelSrc
                  ? "Showing your uploaded photo. Photos stay in this browser."
                  : previewState === "ready"
                    ? "Try-on complete. Original image unchanged; no AI rendering."
                    : "Optional local photo preview. Photos are not sent to a server."}
            </p>
          </div>

          <div className="builder-side">
            <section className="builder-block builder-step" aria-labelledby="builder-step-models">
              <div className="builder-step-head">
                <span className="builder-step-number" aria-hidden="true">1</span>
                <Heading level={2} id="builder-step-models">Models to Try on</Heading>
                <p className="builder-step-note">Pick the model to fit pieces on, or upload your own photo.</p>
              </div>
              <div className="model-thumbs" aria-label="Choose a model">
                <button
                  className={`model-thumb ${activePhoto === null ? "selected" : ""}`}
                  onClick={() => setActivePhoto(null)}
                  aria-pressed={activePhoto === null}
                >
                  <img loading="lazy" decoding="async" src={image} alt="Default studio model" />
                  <span>Studio</span>
                </button>
                {photos.map((src, i) => (
                  <div key={src} className={`model-thumb ${activePhoto === i ? "selected" : ""}`}>
                    <button onClick={() => setActivePhoto(i)} aria-pressed={activePhoto === i} aria-label={`Fit on uploaded model ${i + 1}`}>
                      <img loading="lazy" decoding="async" src={src} alt={`Uploaded model ${i + 1}`} />
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
            </section>

            <section className="builder-block builder-step" aria-labelledby="builder-step-catalogue">
              <div className="builder-step-head">
                <span className="builder-step-number" aria-hidden="true">2</span>
                <Heading level={2} id="builder-step-catalogue">Clothes to Choose from</Heading>
                <p className="builder-step-note">Choose the pieces you love. The builder recommends the rest.</p>
              </div>
              <section className="shop-grid" aria-label="Product collection">
                {filtered
                  .slice((collectionPage - 1) * 12, collectionPage * 12)
                  .map((p) => (
                    <article className={`shop-product ${isSelected(p) ? "chosen" : ""}`} key={p.sku}>
                      <Button className="shop-product-art" aria-label={`View ${p.name}`} onClick={() => openProduct(p)}>
                        <ProductImage product={p} Garment={Garment} />
                        <span className="product-art-label">
                          {!p.stock ? "Unavailable" : isSelected(p) ? "Selected" : ""}
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
                      <div className="product-actions">
                        <Button
                          className={`button ${isSelected(p) ? "secondary" : "primary"} product-outfit-action`}
                          disabled={!p.stock}
                          aria-pressed={isSelected(p)}
                          onClick={() => togglePiece(p)}
                        >
                          <Icon name={isSelected(p) ? "close" : "plus"} />
                          {isSelected(p) ? "Remove from outfit" : "Add to outfit"}
                        </Button>
                        <Button
                          className="button secondary product-cart-action"
                          disabled={!p.stock}
                          onClick={() => addCartItem(p)}
                        >
                          <Icon name="bag" />
                          Add to cart
                        </Button>
                      </div>
                    </article>
                  ))}
                {!filtered.length && (
                  <div className="empty">
                    {products.length
                      ? "No pieces match this category."
                      : "No pieces are available yet. Products appear here once a merchant adds them to the catalogue."}
                  </div>
                )}
              </section>
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
            </section>

            <section className="builder-block builder-step" aria-labelledby="builder-step-recommendation">
              <div className="builder-step-head">
                <span className="builder-step-number" aria-hidden="true">3</span>
                <Heading level={2} id="builder-step-recommendation">Recommendation</Heading>
                <p className="builder-step-note">Your coordinated look, refreshed automatically.</p>
              </div>
              {bundle.length > 1 && <PairingGraph items={bundle} />}
              <section className="outfit-tray" aria-label="Recommended look">
                <Heading level={2}>
                  Your recommended look
                  {bundle.length > 0 && (
                    <span className="look-count">
                      {bundle.length} {bundle.length === 1 ? "piece" : "pieces"}
                    </span>
                  )}
                </Heading>
                {bundle.length ? (
                  outfitRows
                ) : (
                  <p className="shop-demo-note">Select one or more pieces above and the builder recommends a coordinated look.</p>
                )}
              </section>
              <div className="builder-ai">
                <Button
                  className="button primary builder-ai-button"
                  disabled={
                    !photoConfigured || !hasModelPhoto || photoReco.status === "loading"
                  }
                  onClick={runPhotoRecommendation}
                >
                  <Icon name="sparkle" />
                  {photoReco.status === "loading"
                    ? "Styling your look…"
                    : "Get AI recommendation"}
                </Button>
                <p className="shop-demo-note">
                  {hasModelPhoto
                    ? "Your uploaded model photo is sent to the configured AI endpoint to build this look."
                    : "Upload a model photo in the fitting studio to get an AI recommendation."}
                </p>
                {!photoConfigured && (
                  <p className="shop-demo-note">
                    Photo styling is not configured. Set the AMD vision key to enable it.
                  </p>
                )}
                {photoReco.note && (
                  <p className="shop-demo-note" role="status">
                    {photoReco.note}
                  </p>
                )}
                {photoReco.error && (
                  <div className="shop-error" role="alert">
                    {photoReco.error}
                  </div>
                )}
                {photoReco.warnings.length > 0 && (
                  <ul className="builder-ai-warnings">
                    {photoReco.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
              {error && (
                <div className="shop-error" role="alert">
                  {error}
                </div>
              )}
              <div className="builder-buttons">
                <Button className="button primary" disabled={!bundle.length} onClick={addCart}>
                  <Icon name="bag" />
                  Add to Cart
                </Button>
                <Button
                  className="button secondary"
                  disabled={!bundle.length}
                  onClick={openFitting}
                >
                  Try on
                  <Icon name="arrow" />
                </Button>
                <Button
                  className="button secondary"
                  disabled={!selected.length}
                  onClick={() => {
                    setSelected([])
                    setBundle([])
                    setError("")
                  }}
                >
                  Clear selection
                </Button>
              </div>
            </section>
          </div>
        </div>
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
                <Button
                  className={`button ${isSelected(detailProduct) ? "secondary" : "primary"} full`}
                  disabled={!isSelected(detailProduct) && !detailProduct.stock}
                  onClick={() => {
                    togglePiece(detailProduct)
                    notify(isSelected(detailProduct) ? "Piece removed from your outfit." : "Piece added to your outfit.")
                  }}
                >
                  <Icon name={isSelected(detailProduct) ? "close" : "plus"} />
                  {isSelected(detailProduct) ? "Remove from outfit" : "Add to outfit"}
                </Button>
                <Button className="button secondary full"
                  disabled={!detailProduct.stock}
                  onClick={() => addCartItem(detailProduct)}
                >
                  <Icon name="bag" />
                  Add this piece to cart
                </Button>
                <Button className="button secondary full"
                  disabled={!detailProduct.stock}
                  onClick={() => {
                    setSelected([detailProduct])
                    setBundle([detailProduct])
                    setError("")
                    setPreviewState("idle")
                    openFitting()
                  }}>
                  Fit this piece <Icon name="arrow" />
                </Button>
                {error && <p className="shop-error" role="alert">{error}</p>}
                <Button className="button secondary full" onClick={() => go("collection")}>
                  {selected.length ? `Style my ${selected.length} selected pieces` : "Continue shopping"}
                  <Icon name="arrow" />
                </Button>
                <small className="shop-demo-note">Add pieces, then the builder recommends the rest of your look.</small>
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
                        <Heading level={2}>{entry.items.length === 1 ? `Item ${index + 1}` : `Outfit ${index + 1}`}</Heading>
                        <small>{entry.style} · {entry.occasion} · {entry.items.length} {entry.items.length === 1 ? "piece" : "pieces"}</small>
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
                              {productColor(p)} · {money(p.price)} each
                            </small>
                          </div>
                          <div className="cart-piece-controls">
                            <div className="bundle-quantity">
                              <Button className="icon-button" aria-label={`Decrease ${p.name} quantity in outfit ${index + 1}`} disabled={entry.quantities[p.sku] === 1} onClick={() => changePieceQuantity(entry.id, p.sku, -1)}>−</Button>
                              <strong aria-live="polite">{entry.quantities[p.sku]}</strong>
                              <Button className="icon-button" aria-label={`Increase ${p.name} quantity in outfit ${index + 1}`} disabled={!canAddBundle([p])} onClick={() => changePieceQuantity(entry.id, p.sku, 1)}><Icon name="plus" /></Button>
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
      {view === "fitting" && (
        !signedIn ? (
          <section className="panel fitting-gate" aria-label="Sign in to try on">
            <Heading level={2}>Sign in to try on</Heading>
            <p className="shop-demo-note">
              Browse and chat with the stylist freely. Sign in to fit the look on a
              model.
            </p>
            <Button className="button primary" onClick={onRequireLogin}>
              Sign in
              <Icon name="arrow" />
            </Button>
          </section>
        ) : (
        <>
          <div className="outfit-context">
            <div className="outfit-context-pieces">
              <span className="outfit-context-label">Your selected pieces</span>
              <div className="outfit-piece-tags">
                {selected.map((p) => <span className="outfit-piece-tag" key={p.sku}>{p.name}</span>)}
              </div>
            </div>
            <Button className="button secondary outfit-context-edit" onClick={() => go("collection")}>
              Edit selection
              <Icon name="settings" />
            </Button>
          </div>
          <div className="studio-layout">
            <div className="fitting-model">
              <div className="fitting-canvas">
                <img
                  loading="lazy"
                  decoding="async"
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
                        <span key={p.sku} className="complete-chip">{p.category} · {p.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {previewState === "loading" && (
                  <div className="inference-skeleton" role="status">
                    <div className="skeleton-block" />
                    <strong>Preparing try-on…</strong>
                    <span>AI garment rendering is not connected.</span>
                  </div>
                )}
              </div>
            </div>
            <section className="outfit-tray">
              <Heading level={2}>Fit your look</Heading>
              {outfitRows}
              <Button
                className="button primary full"
                disabled={previewState === "loading" || !bundle.length}
                onClick={() => {
                  setPreviewState("loading")
                  previewTimer.current = setTimeout(
                    () => setPreviewState("ready"),
                    1200,
                  )
                }}
              >
                <Icon name="layers" />
                {previewState === "loading"
                  ? "Preparing try-on…"
                  : bundle.length
                    ? `Virtual try-on · ${bundle.length} ${bundle.length === 1 ? "piece" : "pieces"}`
                    : "Virtual try-on"}
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
                  <img loading="lazy" decoding="async" src={image} alt="Default studio model" />
                  <span>Studio</span>
                </button>
                {photos.map((src, i) => (
                  <button key={src} className={`model-thumb ${activePhoto === i ? "selected" : ""}`}
                    onClick={() => setActivePhoto(i)} aria-pressed={activePhoto === i}>
                    <img loading="lazy" decoding="async" src={src} alt={`Uploaded model ${i + 1}`} />
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
          <div className="checkout-dock blur-16">
            <small>{bundle.length} ITEMS</small>
            <div>
              <strong>{money(total)}</strong>
              <Button className="button primary" onClick={addCart}>
                <Icon name="bag" />
                Add to cart
              </Button>
            </div>
          </div>
        </>
        )
      )}
    </>
  )
}
