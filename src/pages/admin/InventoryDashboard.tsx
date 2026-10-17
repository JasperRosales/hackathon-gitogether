import { lazy, Suspense, useEffect, useRef, useState } from "react"
import type { MutableRefObject } from "react"
import { createPortal } from "react-dom"
import { Button, Input, Heading } from "@/components/ui"
import { Icon, Garment } from "@/components/Icon"
import PanelTitle from "@/components/PanelTitle"
import ProductImage from "@/components/ProductImage"
import CatalogueDetails from "@/components/CatalogueDetails"
import type { CatalogueApi } from "@/lib/useCatalogue"
import type { Product } from "@/lib/catalogue"

const BundleClassify = lazy(() => import("@/components/BundleClassify"))
const InventoryEditor = lazy(() => import("@/components/InventoryEditor"))

type Props = {
  api: CatalogueApi
  sourceLabel: string
  query: string
  setQuery: (query: string) => void
  /** Updated every render so background refresh can skip while modals are open. */
  busyRef: MutableRefObject<() => boolean>
}

export default function InventoryDashboard({
  api,
  sourceLabel,
  query,
  setQuery,
  busyRef,
}: Props) {
  const { catalogue, products, sync, classifying } = api
  const [bundleOpen, setBundleOpen] = useState(false)
  const [inventoryEditor, setInventoryEditor] = useState<Product | null | undefined>(undefined)
  const [details, setDetails] = useState<{
    sku: string
    mode: "variants" | "alternatives"
  } | null>(null)
  const [cataloguePage, setCataloguePage] = useState(1)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const inventoryTrigger = useRef<HTMLButtonElement | null>(null)
  const addProductTrigger = useRef<HTMLButtonElement | null>(null)
  const bundleTrigger = useRef<HTMLButtonElement | null>(null)
  const detailsTrigger = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    busyRef.current = () =>
      bundleOpen || inventoryEditor !== undefined || sync === "loading"
  })
  useEffect(() => setCataloguePage(1), [query, products])

  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()),
  )
  const cataloguePages = Math.max(1, Math.ceil(filteredProducts.length / 12))
  const catalogueRows = filteredProducts.slice(
    (cataloguePage - 1) * 12,
    cataloguePage * 12,
  )

  const closeInventoryEditor = () => {
    setInventoryEditor(undefined)
    if (inventoryTrigger.current?.isConnected) inventoryTrigger.current.focus()
    else addProductTrigger.current?.focus()
  }
  const openInventoryEditor = (product: Product | null, trigger: HTMLButtonElement) => {
    inventoryTrigger.current = trigger
    if (!product) addProductTrigger.current = trigger
    setInventoryEditor(product)
    setBundleOpen(false)
    setDetails(null)
  }
  const closeBundle = () => {
    setBundleOpen(false)
    bundleTrigger.current?.focus()
  }
  const closeDetails = () => {
    setDetails(null)
    detailsTrigger.current?.focus()
  }
  const saveInventoryProduct = (product: Product) => {
    if (!api.saveInventoryProduct(product)) return false
    closeInventoryEditor()
    return true
  }
  const deleteInventoryProduct = (sku: string) => {
    if (!api.deleteInventoryProduct(sku)) return false
    closeInventoryEditor()
    return true
  }
  const removeProduct = (sku: string) => {
    if (api.deleteInventoryProduct(sku)) setConfirmRemove(null)
  }
  const applyBundle = (incoming: Product[]) => {
    if (!api.applyCatalogue(incoming, "AI")) return false
    closeBundle()
    return true
  }
  return (
    <>
      <section className="panel inventory-configuration">
        <PanelTitle title="Inventory settings" />
        <div className="inventory-settings">
          <div>
            <span className="outfit-context-label">Source</span>
            <strong>{sourceLabel}</strong>
            <p>
              Add products and manage available units by size below, then use
              “Classify photos” to let AI detect categories, colours and prices
              straight from product photos.
            </p>
          </div>
        </div>
        <div className="panel-foot" role="status">
          <span>
            {classifying
              ? "AI is tagging products…"
              : sync === "loading"
                ? "Updating inventory…"
                : catalogue.updatedAt
                  ? `Last update: ${catalogue.updatedAt}`
                  : "No catalogue yet"}
          </span>
          <span>Manual updates</span>
        </div>
      </section>
      <section className="panel catalogue-panel">
        <div className="catalogue-heading">
          <div className="catalogue-heading-title">
            <Heading level={2}>Products & stock</Heading>
            <span className="catalogue-count">{products.length}</span>
          </div>
          <div className="catalogue-controls">
            <div className="catalogue-search">
              <Icon name="search" />
              <Input
                aria-label="Search catalogue"
                placeholder="Search products or SKU"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <Button
                  className="icon-button"
                  aria-label="Clear catalogue search"
                  onClick={() => setQuery("")}
                >
                  <Icon name="close" />
                </Button>
              )}
            </div>
            <Button
              className="button primary"
              aria-expanded={inventoryEditor === null}
              onClick={(event) => openInventoryEditor(null, event.currentTarget)}
            >
              <Icon name="plus" />
              Add product
            </Button>
            <Button
              className="button secondary"
              aria-expanded={bundleOpen}
              onClick={(event) => {
                bundleTrigger.current = event.currentTarget
                setBundleOpen(!bundleOpen)
                setInventoryEditor(undefined)
                setDetails(null)
              }}
            >
              <Icon name="sparkle" />
              Classify photos
            </Button>
          </div>
        </div>
        {inventoryEditor !== undefined && (
          createPortal(
            <Suspense fallback={<div className="import-placeholder" role="status">Loading inventory editor…</div>}>
              <div className="inventory-editor-modal" role="presentation" onMouseDown={closeInventoryEditor}>
                <div className="inventory-editor-dialog" role="dialog" aria-modal="true" aria-label={inventoryEditor ? `Edit ${inventoryEditor.name}` : "Add product"} onMouseDown={(event) => event.stopPropagation()}>
                  <InventoryEditor key={inventoryEditor?.sku || "new-product"} product={inventoryEditor}
                    products={products} apiConnected={false} Icon={Icon}
                    onSave={saveInventoryProduct} onDelete={deleteInventoryProduct} onClose={closeInventoryEditor} />
                </div>
              </div>
            </Suspense>,
            document.body,
          )
        )}
        {bundleOpen && (
          <Suspense
            fallback={
              <div className="import-placeholder" role="status">
                Loading AI classifier…
              </div>
            }
          >
            <BundleClassify
              products={products}
              Icon={Icon}
              Garment={Garment}
              onClose={closeBundle}
              onApply={applyBundle}
            />
          </Suspense>
        )}
        <div className="table-wrap">
          <table className="catalogue-table" aria-label="Product catalogue">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col" className="numeric-cell">Price</th>
                <th scope="col">Availability</th>
                <th scope="col" className="action-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalogueRows.map((p) => (
                <tr key={p.sku}>
                  <td>
                    <div className="product-cell">
                      <div className="product-thumb">
                        <ProductImage product={p} Garment={Garment} />
                      </div>
                      <div>
                        <strong>{p.name}</strong>
                        <small>{p.sku}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="table-category">{p.category}</span>
                  </td>
                  <td className="numeric-cell">
                    ₱{p.price.toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={`inventory-state ${
                        p.stock === 0
                          ? "unavailable"
                          : p.stock < 10
                            ? "low-stock"
                            : ""
                      }`}
                    >
                      <span className="inventory-dot" aria-hidden="true" />
                      {p.stock === 0
                        ? "Out of stock"
                        : p.stock < 10
                          ? `${p.stock} left`
                          : `${p.stock} available`}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="row-actions">
                      {confirmRemove === p.sku ? (
                        <>
                          <Button
                            className="table-action table-action-primary"
                            aria-label={`Confirm removing ${p.name}`}
                            onClick={() => removeProduct(p.sku)}
                          >
                            <Icon name="trash" />
                            Confirm
                          </Button>
                          <Button
                            className="table-action"
                            onClick={() => setConfirmRemove(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            className="table-action"
                            aria-label={`Edit ${p.name}`}
                            onClick={(event) =>
                              openInventoryEditor(p, event.currentTarget)
                            }
                          >
                            <Icon name="edit" />
                            Edit
                          </Button>
                          <Button
                            className="table-action"
                            aria-label={`Remove ${p.name}`}
                            onClick={() => setConfirmRemove(p.sku)}
                          >
                            <Icon name="trash" />
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.some((p) =>
            `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()),
          ) && (
            <div className="empty">
              {products.length
                ? `No products match “${query}”. Try a product name or SKU.`
                : "Your inventory is empty. Add a product or classify product photos to build it."}
            </div>
          )}
        </div>
        <div className="catalogue-pagination">
          <span aria-live="polite">
            {filteredProducts.length} matching products
            {` · Page ${cataloguePage} of ${cataloguePages}`}
          </span>
          <div>
            <Button
              className="table-action"
              disabled={cataloguePage === 1}
              onClick={() =>
                setCataloguePage((current) => Math.max(1, current - 1))
              }
            >
              Previous
            </Button>
            <Button
              className="table-action"
              disabled={cataloguePage >= cataloguePages}
              onClick={() =>
                setCataloguePage((current) => Math.min(cataloguePages, current + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
        {details && products.some((p) => p.sku === details.sku) && (
          <CatalogueDetails
            key={`${details.sku}-${details.mode}`}
            product={products.find((p) => p.sku === details.sku)!}
            products={products}
            mode={details.mode}
            Icon={Icon}
            onClose={closeDetails}
            onView={(sku) => setDetails({ sku, mode: "variants" })}
          />
        )}
        <div className="panel-foot">
          <span>
            {catalogue.source !== "None"
              ? "Local catalogue snapshot · browser-tab storage · manual updates"
              : "Add a product or classify product photos to build your catalogue"}
          </span>
          {sync === "error" && (
            <span role="alert">
              Update failed. Existing data retained.
            </span>
          )}
        </div>
      </section>
    </>
  )
}
