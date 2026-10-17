import { lazy, Suspense, useEffect, useRef, useState } from "react"
import type { MutableRefObject } from "react"
import { createPortal } from "react-dom"
import { Button, Input, Select, Heading } from "@/components/ui"
import { Icon, Garment } from "@/components/Icon"
import PanelTitle from "@/components/PanelTitle"
import ProductImage from "@/components/ProductImage"
import CatalogueDetails from "@/components/CatalogueDetails"
import type { CatalogueApi } from "@/lib/useCatalogue"
import type { Product } from "@/lib/catalogue"

const CatalogueImport = lazy(() => import("@/components/CatalogueImport"))
const CatalogueApi = lazy(() => import("@/components/CatalogueApi"))
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
  const { catalogue, products, sync, refreshInterval, setRefreshInterval, abortRefresh } = api
  const [importOpen, setImportOpen] = useState(false)
  const [apiOpen, setApiOpen] = useState(false)
  const [inventoryEditor, setInventoryEditor] = useState<Product | null | undefined>(undefined)
  const [details, setDetails] = useState<{
    sku: string
    mode: "variants" | "alternatives"
  } | null>(null)
  const [cataloguePage, setCataloguePage] = useState(1)
  const inventoryTrigger = useRef<HTMLButtonElement | null>(null)
  const addProductTrigger = useRef<HTMLButtonElement | null>(null)
  const importTrigger = useRef<HTMLButtonElement | null>(null)
  const apiTrigger = useRef<HTMLButtonElement | null>(null)
  const detailsTrigger = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    busyRef.current = () =>
      importOpen || apiOpen || inventoryEditor !== undefined || sync === "loading"
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
    abortRefresh()
    inventoryTrigger.current = trigger
    if (!product) addProductTrigger.current = trigger
    setInventoryEditor(product)
    setImportOpen(false)
    setApiOpen(false)
    setDetails(null)
  }
  const closeApi = () => {
    setApiOpen(false)
    apiTrigger.current?.focus()
  }
  const closeImport = () => {
    setImportOpen(false)
    importTrigger.current?.focus()
  }
  const closeDetails = () => {
    setDetails(null)
    detailsTrigger.current?.focus()
  }
  const importCatalogue = (incoming: Product[]) => {
    if (!api.importCatalogue(incoming)) return false
    closeImport()
    return true
  }
  const connectCatalogue = (
    incoming: Product[],
    endpoint: string,
    mode: "merge" | "replace",
  ) => {
    if (!api.connectCatalogue(incoming, endpoint, mode)) return false
    closeApi()
    return true
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
  const refreshNow = async () => {
    setDetails(null)
    await api.refreshApi()
  }
  return (
    <>
      <section className="panel inventory-configuration">
        <PanelTitle title="Inventory settings" />
        <div className="inventory-settings">
          <div>
            <span className="outfit-context-label">Source</span>
            <strong>{sourceLabel}</strong>
            <p>Add products and manage available units by size below. For externally managed inventory, import a CSV or connect a public HTTPS API.</p>
            {catalogue.endpoint && <span className="inventory-endpoint">{catalogue.endpoint}</span>}
          </div>
          <label>
            Automatic inventory refresh
            <Select value={catalogue.source === "API" ? refreshInterval : 0}
              disabled={catalogue.source !== "API"}
              onChange={(e) => {
                abortRefresh()
                setRefreshInterval(Number(e.target.value))
              }}>
              <option value={0}>Manual only</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every minute</option>
              <option value={300}>Every 5 minutes</option>
            </Select>
            <small>Runs only while this merchant tab is visible. CSV imports are snapshots; private APIs require a secure backend.</small>
          </label>
        </div>
        <div className="panel-foot" role="status">
          <span>{sync === "loading" ? "Updating inventory…" : sync === "error" ? "Update failed. Previous inventory retained." : catalogue.updatedAt ? `Last update: ${catalogue.updatedAt}` : "No catalogue yet"}</span>
          <span>{catalogue.source === "API" && refreshInterval ? "Automatic refresh enabled" : "Manual updates"}</span>
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
              disabled={sync === "loading"}
              aria-expanded={importOpen}
              onClick={(e) => {
                importTrigger.current = e.currentTarget
                setImportOpen(!importOpen)
                setApiOpen(false)
                setInventoryEditor(undefined)
                setDetails(null)
              }}
            >
              <Icon name="upload" />
              Import CSV
            </Button>
            <Button
              className="button secondary"
              disabled={sync === "loading"}
              aria-expanded={apiOpen}
              onClick={(e) => {
                apiTrigger.current = e.currentTarget
                setApiOpen(!apiOpen)
                setImportOpen(false)
                setInventoryEditor(undefined)
                setDetails(null)
              }}
            >
              <Icon name="link" />
              Connect API
            </Button>
            {catalogue.source === "API" && (
              <Button
                className="button secondary"
                disabled={sync === "loading"}
                onClick={() => void refreshNow()}
              >
                <Icon name="swap" />
                {sync === "loading" ? "Refreshing…" : "Refresh API"}
              </Button>
            )}
          </div>
        </div>
        {inventoryEditor !== undefined && (
          createPortal(
            <Suspense fallback={<div className="import-placeholder" role="status">Loading inventory editor…</div>}>
              <div className="inventory-editor-modal" role="presentation" onMouseDown={closeInventoryEditor}>
                <div className="inventory-editor-dialog" role="dialog" aria-modal="true" aria-label={inventoryEditor ? `Edit ${inventoryEditor.name}` : "Add product"} onMouseDown={(event) => event.stopPropagation()}>
                  <InventoryEditor key={inventoryEditor?.sku || "new-product"} product={inventoryEditor}
                    products={products} apiConnected={catalogue.source === "API"} Icon={Icon}
                    onSave={saveInventoryProduct} onDelete={deleteInventoryProduct} onClose={closeInventoryEditor} />
                </div>
              </div>
            </Suspense>,
            document.body,
          )
        )}
        {importOpen && (
          <Suspense
            fallback={
              <div className="import-placeholder" role="status">
                Loading import form…
              </div>
            }
          >
            <CatalogueImport
              products={products}
              Icon={Icon}
              Garment={Garment}
              onClose={closeImport}
              onImport={importCatalogue}
            />
          </Suspense>
        )}
        {apiOpen && (
          <Suspense
            fallback={
              <div className="import-placeholder" role="status">
                Loading API connection form…
              </div>
            }
          >
            <CatalogueApi
              products={products}
              initialEndpoint={catalogue.endpoint}
              Icon={Icon}
              Garment={Garment}
              onClose={closeApi}
              onConnect={connectCatalogue}
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
                <th scope="col" className="action-cell" aria-label="Edit" />
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
                    <Button
                      className="icon-button inventory-edit-action"
                      aria-label={`Edit ${p.name}`}
                      onClick={(event) => openInventoryEditor(p, event.currentTarget)}
                    >
                      <Icon name="edit" />
                    </Button>
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
                : "Your inventory is empty. Add a product or import your stock."}
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
              ? catalogue.source === "API" && refreshInterval
                ? "Local inventory snapshot · automatic refresh in this merchant tab"
                : "Local catalogue snapshot · browser-tab storage · manual updates"
              : "Import a CSV, connect an API or add a product to build your catalogue"}
          </span>
          {sync === "error" && (
            <span role="alert">
              API unavailable. Existing data retained; retry refresh.
            </span>
          )}
        </div>
      </section>
    </>
  )
}
