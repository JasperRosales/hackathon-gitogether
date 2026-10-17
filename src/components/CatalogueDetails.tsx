import { useEffect, useRef, useState } from "react"
import type { ComponentType } from "react"
import { Button, Heading, Select } from "./ui"
import { variantStock, productSizes, catalogueSizes } from "../lib/catalogue"
import type { Product } from "../lib/catalogue"

type Props = {
  product: Product
  products: Product[]
  mode: "variants" | "alternatives"
  Icon: ComponentType<{ name: string }>
  onClose: () => void
  onView: (sku: string) => void
}

export default function CatalogueDetails({
  product,
  products,
  mode,
  Icon,
  onClose,
  onView,
}: Props) {
  const [size, setSize] = useState(
    catalogueSizes(products).includes("M")
      ? "M"
      : catalogueSizes(products)[0] || "M",
  )
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    panel.current?.focus()
    panel.current?.scrollIntoView({ block: "nearest", behavior: "instant" })
  }, [])
  const alternatives = products.filter(
    (p) =>
      p.sku !== product.sku &&
      p.category === product.category &&
      variantStock(p, size) > 0,
  )
  return (
    <section
      className="catalogue-details"
      id="catalogue-details"
      role="region"
      aria-labelledby="catalogue-details-title"
      tabIndex={-1}
      ref={panel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      <div className="details-heading">
        <div>
          <span className="eyebrow">
            {mode === "variants"
              ? "SIZE AVAILABILITY"
              : "IN-STOCK ALTERNATIVES"}
          </span>
          <Heading level={3} id="catalogue-details-title">
            {product.name}
          </Heading>
          <p>
            {product.sku} · {product.category} · ₱{product.price.toFixed(2)}
          </p>
        </div>
        <Button
          className="icon-button"
          aria-label="Close product details"
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
      </div>
      {mode === "variants" ? (
        <>
          <div className="variant-grid">
            {productSizes(product).map((s) => (
              <div
                className={`variant-tile ${
                  variantStock(product, s) ? "" : "variant-unavailable"
                }`}
                key={s}
              >
                <strong>{s}</strong>
                <span>
                  {product.variants
                    ? `${variantStock(product, s)} units`
                    : variantStock(product, s)
                      ? "Available"
                      : "Unavailable"}
                </span>
              </div>
            ))}
          </div>
          <p className="details-note">
            {product.stock} total units.{" "}
            {product.variants
              ? "Per-size quantities from the local catalogue snapshot. Not automatically synchronized."
              : "Size statuses are sample fixtures, not per-size quantities or a live inventory check."}
          </p>
        </>
      ) : (
        <>
          <label className="alternative-size">
            Check size
            <Select value={size} onChange={(e) => setSize(e.target.value)}>
              {catalogueSizes(products).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </label>
          {alternatives.length ? (
            <div className="alternative-list">
              {alternatives.map((p) => (
                <div className="alternative-item" key={p.sku}>
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      {p.sku} · Size {size} available
                    </small>
                  </div>
                  <span>₱{p.price.toFixed(2)}</span>
                  <Button
                    className="table-action"
                    onClick={() => onView(p.sku)}
                  >
                    View variants
                    <Icon name="arrow" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="details-empty" role="status">
              No in-stock {product.category.toLowerCase()} alternatives in size{" "}
              {size}. Try another size.
            </p>
          )}
          <p className="details-note">
            Same-category local catalogue candidates only. Reviewing
            alternatives does not modify source inventory or automatically
            substitute a retailer product.
          </p>
        </>
      )}
    </section>
  )
}
