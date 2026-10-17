import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useDispatch } from "react-redux"
import { Button, Input, Select, Heading, Form } from "./components/ui"
import CustomerShop from "./components/CustomerShop"
import Footer from "./components/Footer"
import ExperienceLanding from "./components/ExperienceLanding"
import CatalogueDetails from "./components/CatalogueDetails"
import fittingModel from "./assets/fitting-fashion-model.jpg"
import ProductImage from "./components/ProductImage"
import { setCatalogue as setCatalogueAction, setSession as setSessionAction, clearSession as clearSessionAction } from "./lib/store"
import {
  catalogueKey,
  readCatalogue,
  productSizes,
  variantStock,
  fetchApiCatalogue,
  mergeCatalogue,
  safeApiEndpoint,
} from "./lib/catalogue"
import type { Product, Catalogue } from "./lib/catalogue"
const CatalogueImport = lazy(() => import("./components/CatalogueImport"))
const CatalogueApi = lazy(() => import("./components/CatalogueApi"))
const InventoryEditor = lazy(() => import("./components/InventoryEditor"))

type Session = {
  name: string
  email: string
  role: "customer" | "merchant"
}
const sessionKey = "forma-demo-session"
function readSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(sessionKey) || "null")
    return value &&
      typeof value.name === "string" &&
      value.name.trim() &&
      typeof value.email === "string" &&
      ["customer", "merchant"].includes(value.role)
      ? value
      : null
  } catch {
    return null
  }
}
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

const sampleProducts: Product[] = [
  {
    name: "Structured linen blazer",
    category: "Outerwear",
    sku: "AT-BL-001",
    price: 3490,
    stock: 42,
  },
  {
    name: "Essential cotton shirt",
    category: "Top",
    sku: "AT-SH-002",
    price: 1490,
    stock: 86,
  },
  {
    name: "Relaxed tailored trousers",
    category: "Bottom",
    sku: "AT-TR-003",
    price: 2490,
    stock: 18,
  },
  {
    name: "Classic leather loafers",
    category: "Footwear",
    sku: "AT-LF-004",
    price: 3990,
    stock: 7,
  },
  {
    name: "Ribbed cotton vest",
    category: "Top",
    sku: "AT-VS-005",
    price: 1290,
    stock: 24,
  },
  {
    name: "Straight-leg trousers",
    category: "Bottom",
    sku: "AT-TR-006",
    price: 2790,
    stock: 0,
  },
  {
    name: "Canvas low-top sneakers",
    category: "Footwear",
    sku: "AT-SN-007",
    price: 2290,
    stock: 31,
  },
  {
    name: "Leather shoulder bag",
    category: "Accessory",
    sku: "AT-BG-008",
    price: 4490,
    stock: 12,
  },
]
const image = fittingModel
function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    catalogue: "M4 4h16v16H4z M4 9h16 M9 9v11",
    layers: "m12 3 10 5-10 5L2 8Z M2 12l10 5 10-5 M2 16l10 5 10-5",
    settings: "M4 7h16 M4 17h16 M8 4v6 M16 14v6",
    edit: "M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3 M14.5 7.5l2 2",
    arrow: "M5 12h14 m-5-5 5 5-5 5",
    upload: "M12 16V3 m-5 5 5-5 5 5 M4 14v6h16v-6",
    check: "m5 12 4 4L19 6",
    close: "m6 6 12 12 M6 18 18 6",
    trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
    swap: "M3 7h17l-4-4 M21 17H4l4 4",
    bag: "M4 7h16l1 14H3Z M8 8V6a4 4 0 0 1 8 0v2",
    clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 6v6l4 2",
    logout: "M9 4H4v16h5 M9 12h12 m-4-4 4 4-4 4",
    search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6",
    plus: "M12 5v14 M5 12h14",
    sidebar: "M3 4h18v16H3z M9 4v16 M5.5 8h1 M5.5 12h1",
    link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  }
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  )
}
function Garment({ type }: { type: string }) {
  return (
    <svg viewBox="0 0 80 90" className="garment" aria-hidden="true">
      <path
        fill="currentColor"
        stroke="var(--border-strong)"
        strokeWidth="1"
        d={
          type === "Bottom"
            ? "M23 8h34l5 72H44l-4-48-4 48H18Z"
            : type === "Footwear"
              ? "M10 48h23l7 12 28 7v12H9Z M14 30h23l7 12 24 7v10H13Z"
              : type === "Accessory"
                ? "M18 30h44l5 47H13Z M28 30V20q12-18 24 0v10h-5V20q-7-10-14 0v10Z"
                : "m24 12-17 9 8 18 10-5v44h30V34l10 5 8-18-17-9q-16 13-32 0Z"
        }
      />
    </svg>
  )
}
export default function App() {
  const dispatch = useDispatch()
  const [catalogue, setCatalogue] = useState(() =>
    readCatalogue(sampleProducts),
  )
  useEffect(() => {
    dispatch(setCatalogueAction(catalogue))
  }, [catalogue, dispatch])
  const products = catalogue.products
  const catalogueSourceLabel = catalogue.source === "API" ? "API connection" : catalogue.source === "CSV" ? "CSV import" : catalogue.source === "Manual" ? "Manual inventory" : "Built-in catalogue"
  const unavailableProducts = products.filter((p) => p.stock === 0)
  const firstException = unavailableProducts[0]
  const variantStatuses = products.flatMap((p) =>
    productSizes(p).map((size) => variantStock(p, size) > 0),
  )
  const availability = variantStatuses.length
    ? `${((variantStatuses.filter(Boolean).length / variantStatuses.length) * 100).toFixed(1)}%`
    : "—"
  const [importOpen, setImportOpen] = useState(false)
  const [apiOpen, setApiOpen] = useState(false)
  const [inventoryEditor, setInventoryEditor] = useState<Product | null | undefined>(undefined)
  const inventoryTrigger = useRef<HTMLButtonElement | null>(null)
  const addProductTrigger = useRef<HTMLButtonElement | null>(null)
  const closeInventoryEditor = () => {
    setInventoryEditor(undefined)
    if (inventoryTrigger.current?.isConnected) inventoryTrigger.current.focus()
    else addProductTrigger.current?.focus()
  }
  const openInventoryEditor = (product: Product | null, trigger: HTMLButtonElement) => {
    refreshSequence.current++
    refreshRequest.current?.abort()
    setSync("idle")
    inventoryTrigger.current = trigger
    if (!product) addProductTrigger.current = trigger
    setInventoryEditor(product)
    setImportOpen(false)
    setApiOpen(false)
    setDetails(null)
  }
  const importTrigger = useRef<HTMLButtonElement | null>(null)
  const apiTrigger = useRef<HTMLButtonElement | null>(null)
  const refreshRequest = useRef<AbortController | null>(null)
  const refreshSequence = useRef(0)
  const closeApi = () => {
    setApiOpen(false)
    apiTrigger.current?.focus()
  }
  const closeImport = () => {
    setImportOpen(false)
    importTrigger.current?.focus()
  }
  const [page, setPage] = useState("Home")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(0)
  const [session, setSession] = useState<Session | null>(readSession)
  useEffect(() => {
    if (session) dispatch(setSessionAction(session))
    else dispatch(clearSessionAction())
  }, [session, dispatch])
  const [route, setRoute] = useState(window.location.hash || "#/shop")
  const [details, setDetails] = useState<{
    sku: string
    mode: "variants" | "alternatives"
  } | null>(null)
  const detailsTrigger = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    setDetails(null)
    setImportOpen(false)
    setApiOpen(false)
    setInventoryEditor(undefined)
  }, [page, route])
  useEffect(() => {
    setSync("idle")
    return () => {
      refreshSequence.current++
      refreshRequest.current?.abort()
    }
  }, [route])
  const closeDetails = () => {
    setDetails(null)
    detailsTrigger.current?.focus()
  }
  const navigate = (path: string) => {
    window.location.hash = path
    setRoute(`#${path}`)
    window.scrollTo(0, 0)
  }
  const login = (account: Session) => {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(account))
    } catch {
      /* Session remains usable in memory when storage is blocked. */
    }
    setSession(account)
    setToast("")
    setPage("Home")
    navigate(account.role === "merchant" ? "/merchant" : "/shop")
  }
  const logout = () => {
    try {
      sessionStorage.removeItem(sessionKey)
    } catch {
      /* Clear the in-memory session regardless. */
    }
    setSession(null)
    setToast("")
    setPage("Home")
    setQuery("")
    navigate("/login")
  }
  const studio = route !== "#/merchant" && route !== "#/login"
  useEffect(() => {
    const handleRoute = () => {
      setRoute(window.location.hash || "#/shop")
    }
    window.addEventListener("hashchange", handleRoute)
    return () => window.removeEventListener("hashchange", handleRoute)
  }, [])
  const needsMerchantLogin =
    route === "#/merchant" && session?.role !== "merchant"
  useEffect(() => {
    if (needsMerchantLogin) {
      window.history.replaceState(null, "", "#/login")
      setRoute("#/login")
    }
  }, [needsMerchantLogin])
  const [toast, setToast] = useState("")
  const [query, setQuery] = useState("")
  const [cataloguePage, setCataloguePage] = useState(1)
  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()),
  )
  const cataloguePages = Math.max(1, Math.ceil(filteredProducts.length / 12))
  const catalogueRows = filteredProducts.slice((cataloguePage - 1) * 12, cataloguePage * 12)
  useEffect(() => setCataloguePage(1), [query, products, page])
  const [period, setPeriod] = useState("Last 30 days")
  const [sync, setSync] = useState("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const notify = (text: string) => {
    clearTimeout(timer.current)
    setToast(text)
    timer.current = setTimeout(() => setToast(""), 4000)
  }
  const applyCatalogue = (
    incoming: Product[],
    source: "CSV" | "API" | "Manual",
    endpoint?: string,
    apiMode?: "merge" | "replace",
    background = false,
  ) => {
    const publicEndpoint =
      source === "API" ? safeApiEndpoint(endpoint || "") : undefined
    if (source === "API" && !publicEndpoint) return false
    const next: Catalogue = {
      products: incoming,
      source,
      updatedAt: new Date().toLocaleString(),
      ...(source === "API" ? { endpoint: publicEndpoint!, apiMode } : {}),
    }
    try {
      sessionStorage.setItem(catalogueKey, JSON.stringify(next))
    } catch {
      return false
    }
    refreshSequence.current++
    refreshRequest.current?.abort()
    setCatalogue(next)
    if (!background) {
      if (source !== "API" || endpoint !== catalogue.endpoint) setRefreshInterval(0)
      setPage("Configuration")
      setQuery("")
      setDetails(null)
      closeImport()
      closeApi()
    }
    setSync("idle")
    if (!background) notify(
      `${incoming.length} products available in this browser catalogue. No retailer API was changed.`,
    )
    return true
  }
  const importCatalogue = (incoming: Product[]) =>
    applyCatalogue(incoming, "CSV")
  const saveInventoryProduct = (product: Product) => {
    const exists = products.some((p) => p.sku === product.sku)
    const next = exists ? products.map((p) => p.sku === product.sku ? product : p) : [...products, product]
    if (!applyCatalogue(next, "Manual")) return false
    closeInventoryEditor()
    notify(exists ? "Product and stock updated." : "Product added to your inventory.")
    return true
  }
  const deleteInventoryProduct = (sku: string) => {
    if (!applyCatalogue(products.filter((p) => p.sku !== sku), "Manual")) return false
    closeInventoryEditor()
    notify("Product removed from your local inventory.")
    return true
  }
  const connectCatalogue = (
    incoming: Product[],
    endpoint: string,
    mode: "merge" | "replace",
  ) =>
    applyCatalogue(
      mergeCatalogue(products, incoming, mode),
      "API",
      endpoint,
      mode,
    )
  const refreshApi = async (background = false) => {
    if (!catalogue.endpoint) return
    if (background && (importOpen || apiOpen || inventoryEditor !== undefined || sync === "loading")) return
    if (!background) {
      setImportOpen(false)
      setApiOpen(false)
      setDetails(null)
    }
    refreshRequest.current?.abort()
    const controller = new AbortController()
    refreshRequest.current = controller
    const sequence = ++refreshSequence.current
    setSync("loading")
    try {
      const result = await fetchApiCatalogue(
        catalogue.endpoint,
        controller.signal,
      )
      if (sequence !== refreshSequence.current || controller.signal.aborted)
        return
      if (result.errors.length) throw new Error(result.errors[0])
      if (
        !applyCatalogue(
          mergeCatalogue(products, result.products, catalogue.apiMode || "merge"),
          "API",
          catalogue.endpoint,
          catalogue.apiMode || "merge",
          background,
        )
      )
        throw new Error(
          "Browser storage is unavailable or full. Existing catalogue was retained.",
        )
    } catch (error) {
      if (sequence === refreshSequence.current && !controller.signal.aborted) {
        setSync("error")
        if (!background) notify(
          error instanceof Error
            ? error.message
            : "API refresh failed. Existing catalogue was retained.",
        )
      }
    }
  }
  const backgroundRefresh = useRef(refreshApi)
  backgroundRefresh.current = refreshApi
  useEffect(() => {
    if (!refreshInterval || catalogue.source !== "API" || !catalogue.endpoint ||
      route !== "#/merchant" || session?.role !== "merchant") return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(async () => {
        if (cancelled) return
        if (document.visibilityState === "visible") await backgroundRefresh.current(true)
        if (!cancelled) schedule()
      }, refreshInterval * 1000)
    }
    schedule()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [refreshInterval, catalogue.source, catalogue.endpoint, route, session?.role])
  if (route === "#/login" || needsMerchantLogin)
    return <LoginPage onLogin={login} />
  if (studio)
    return (
      <div className="customer-page">
        <CustomerShop
          products={products}
          image={image}
          Icon={Icon}
          Garment={Garment}
          session={session}
          onLogin={() => navigate("/login")}
          onLogout={logout}
          notify={notify}
        />
        {toast && (
          <div className="toast" role="status">
            <Icon name="check" />
            {toast}
            <Button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <Icon name="close" />
            </Button>
          </div>
        )}
      </div>
    )
  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
      <aside className="sidebar" aria-label="Merchant workspace">
        <div className="brand">
          <span className="forma-mark">f.</span>
          {!sidebarCollapsed && <span className="brand-name">Forma</span>}
          <Button className="icon-button sidebar-toggle"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed} aria-controls="merchant-navigation"
            onClick={() => setSidebarCollapsed((current) => !current)}>
            <Icon name="sidebar" />
          </Button>
        </div>
        <nav id="merchant-navigation" aria-label="Merchant navigation">
          {[
            ["Home", "bag"],
            ["Overview", "grid"],
            ["Configuration", "settings"],
            ["Outfit intelligence", "layers"],
          ].map(([label, icon]) => (
            <Button
              key={label}
              className={`nav-item ${page === label ? "active" : ""}`}
              aria-label={label}
              title={label}
              aria-current={page === label ? "page" : undefined}
              onClick={() => setPage(label)}
            >
              <Icon name={icon} />
              <span className="nav-label">{label}</span>
              <span className="nav-tooltip">{label}</span>
            </Button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-account">
            <div className="profile" title={`${session?.name} · Merchant`}>
              <span className="store-avatar">
                {initials(session?.name || "Account")}
              </span>
              <div>
                <strong>{session?.name}</strong>
                <small>Merchant</small>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar merchant-header">
          <span className="header-store">Forma</span>
          <div className="header-actions">
            <Button className="logout-button" onClick={logout}>
              <Icon name="logout" />
              Log out
            </Button>
          </div>
        </header>
        <main>
          {page !== "Home" && <div className={`page-heading ${page === "Overview" ? "overview-heading" : ""}`}>
            <div>
              <Heading level={1}>{page}</Heading>
            </div>
          </div>}
          <>
            {page === "Home" && (
              <ExperienceLanding audience="merchant" productCount={products.length}
                source={catalogueSourceLabel}
                Icon={Icon} onPrimary={() => setPage("Configuration")}
                onSecondary={() => setPage("Overview")} />
            )}
            {page === "Overview" && (
              <>
                <div
                  className={`section-toolbar ${
                    page === "Overview" ? "period-only" : ""
                  }`}
                >
                  {page !== "Overview" && (
                    <Heading level={2}>Performance</Heading>
                  )}
                  <Select
                    aria-label="Reporting period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <option>Last 30 days</option>
                    <option>Last 7 days</option>
                  </Select>
                </div>
                <div className="metric-grid">
                  {[
                    [
                      "Recommendation-assisted sales",
                      period === "Last 7 days" ? "₱8,240" : "₱38,492",
                      "from recommendation-assisted orders",
                      period === "Last 7 days" ? "+8.1%" : "+12.4%",
                    ],
                    [
                      "Average order value",
                      period === "Last 7 days" ? "₱4,120" : "₱4,811.50",
                      "per recommendation-assisted order",
                      period === "Last 7 days" ? "+4.2%" : "+8.7%",
                    ],
                    [
                      "Multi-item order share",
                      period === "Last 7 days" ? "22.1%" : "24.6%",
                      "assisted orders with two or more garments",
                      period === "Last 7 days" ? "+1.2 pp" : "+2.5 pp",
                    ],
                    [
                      "Recommendation engagement",
                      period === "Last 7 days" ? "17.8%" : "19.2%",
                      "displayed recommendations selected",
                      period === "Last 7 days" ? "+0.8 pp" : "+1.4 pp",
                    ],
                  ].map(([label, value, detail, delta], index) => (
                    <section
                      className={`metric-card ${
                        index === 0 ? "metric-featured" : ""
                      }`}
                      key={label}
                    >
                      <div className="metric-label">
                        {label}
                        <span className="metric-icon">
                          <Icon
                            name={
                              ["bag", "catalogue", "layers", "check"][index % 4]
                            }
                          />
                        </span>
                      </div>
                      <div className="metric-reading">
                        <div className="metric-value">{value}</div>
                        <span className="metric-delta" aria-label={`${delta} versus previous period`}>{delta}</span>
                      </div>
                      <p>{detail}</p>
                    </section>
                  ))}
                </div>
              </>
            )}
            {page === "Outfit intelligence" && (
              <section className="panel affinity-panel">
                <PanelTitle
                  title="Top outfit combinations"
                />
                <div className="table-wrap">
                  <table
                    className="affinity-table"
                    aria-label="Outfit performance"
                  >
                    <thead>
                      <tr>
                        <th scope="col">Outfit</th>
                        <th scope="col" className="numeric-cell">
                          Sessions
                        </th>
                        <th scope="col" className="numeric-cell">
                          Conversion
                        </th>
                        <th scope="col">Leading swap pattern</th>
                        <th scope="col">Promotion pairing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          "The everyday edit",
                          "Linen blazer + cotton shirt + trousers",
                          "1,248",
                          "8.4%",
                          "Loafers → sneakers · 18%",
                          "Cotton shirt + tailored trousers",
                        ],
                        [
                          "Modern essentials",
                          "Cotton vest + trousers + sneakers",
                          "986",
                          "7.2%",
                          "Vest → cotton shirt · 12%",
                          "Essential cotton shirt",
                        ],
                        [
                          "The weekend uniform",
                          "Cotton shirt + trousers + shoulder bag",
                          "612",
                          "6.8%",
                          "Bag removed · 9%",
                          "Leather shoulder bag",
                        ],
                      ].map(
                        (
                          [title, desc, sessions, rate, swap, opportunity],
                          i,
                        ) => (
                          <tr key={title}>
                            <td>
                              <div className="outfit-cell">
                                <span className="row-number">0{i + 1}</span>
                                <div>
                                  <strong>{title}</strong>
                                  <small>{desc}</small>
                                </div>
                              </div>
                            </td>
                            <td className="numeric-cell">{sessions}</td>
                            <td className="numeric-cell">
                              <strong className="conversion-value">
                                {rate}
                              </strong>
                            </td>
                            <td>
                              <span className="swap-pattern">{swap}</span>
                            </td>
                            <td>
                              <span className="opportunity-insight">
                                {opportunity}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {page === "Outfit intelligence" && (
              <div className="middle-grid intelligence-details">
                <section className="panel">
                  <PanelTitle title="Frequently swapped items" />
                  <div className="table-wrap">
                    <table aria-label="Frequently swapped items">
                      <thead>
                        <tr>
                          <th scope="col">Original item</th>
                          <th scope="col">Customer preference</th>
                          <th scope="col">Swap share</th>
                          <th scope="col">Suggested action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Leather loafers", "Canvas sneakers", "18%", "Test a casual footwear pairing"],
                          ["Cotton vest", "Cotton shirt", "12%", "Offer a shirt-led alternative"],
                          ["Shoulder bag", "No accessory", "9%", "Keep accessories optional"],
                        ].map(([original, replacement, share, action]) => (
                          <tr key={original}>
                            <td>{original}</td>
                            <td>{replacement}</td>
                            <td className="numeric-cell">{share}</td>
                            <td><span className="opportunity-insight">{action}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section className="panel">
                  <PanelTitle title="Products worth promoting" />
                  <div className="table-wrap">
                    <table aria-label="In-stock promotion candidates">
                      <thead>
                        <tr>
                          <th scope="col">Product</th>
                          <th scope="col">Available units</th>
                          <th scope="col">Next step</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...products].filter((p) => p.stock > 0)
                          .sort((a, b) => b.stock - a.stock).slice(0, 3)
                          .map((p) => (
                            <tr key={p.sku}>
                              <td>{p.name}</td>
                              <td className="numeric-cell">{p.stock}</td>
                              <td>
                                <Button className="table-action" onClick={() => {
                                  setPage("Configuration")
                                  setQuery(p.sku)
                                }}>
                                  Review product <Icon name="arrow" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        {!products.some((p) => p.stock > 0) && (
                          <tr><td colSpan={3}>No in-stock products to promote.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="panel-foot">Highest available stock first. Review demand and margins before promoting.</div>
                </section>
              </div>
            )}
            {page === "Overview" && (
              <div className="middle-grid">
                <section className="panel">
                  <PanelTitle
                    title="Studio-assisted revenue"
                    trailing={<span className="chip">PHP</span>}
                  />
                  <div className="revenue-summary">
                    <strong>
                      {period === "Last 7 days" ? "₱8,240" : "₱38,492"}
                      <span> +16.2%</span>
                    </strong>
                    <div className="chart-legend">
                      <i />
                      Studio-assisted <i className="outline-dot" />
                      Store baseline
                    </div>
                  </div>
                  <div className="chart">
                    <div className="axis">
                      <span>₱12k</span>
                      <span>₱8k</span>
                      <span>₱4k</span>
                      <span>₱0</span>
                    </div>
                    <svg
                      viewBox="0 0 680 150"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Illustrative studio-assisted revenue rises from 4,000 to 12,000 dollars over four weeks"
                    >
                      {[10, 50, 90, 130].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          x2="680"
                          y1={y}
                          y2={y}
                          stroke="var(--border)"
                          strokeDasharray="3 4"
                        />
                      ))}
                      <path
                        d="M0 120 30 114 60 122 90 90 120 96 150 82 180 87 210 64 240 76 270 63 300 70 330 50 360 61 390 42 420 56 450 32 480 40 510 22 540 35 570 16 600 23 640 8 680 14"
                        fill="none"
                        stroke="var(--ink)"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M0 133 30 127 60 135 90 120 120 126 150 113 180 122 210 105 240 115 270 95 300 107 330 89 360 98 390 80 420 92 450 70 480 80 510 60 540 72 570 56 600 64 640 48 680 55"
                        fill="none"
                        stroke="var(--muted)"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                      />
                    </svg>
                    <div className="x-axis">
                      <span>Jun 01</span>
                      <span>Jun 07</span>
                      <span>Jun 14</span>
                      <span>Jun 21</span>
                      <span>Jun 30</span>
                    </div>
                  </div>
                  <div className="panel-foot">
                    Attribution window: 7 days{" "}
                    <span>2,846 sessions</span>
                  </div>
                </section>
                <section className="panel operations-panel">
                  <PanelTitle
                    title="Needs your attention"
                    trailing={
                      <span className="chip">{unavailableProducts.length}</span>
                    }
                  />
                  <div className="attention-item">
                    <span className="attention-icon">
                      <Icon name="catalogue" />
                    </span>
                    <div>
                      <strong>
                        {firstException
                          ? "Product out of stock"
                          : "No product stock exceptions"}
                      </strong>
                      {firstException && (
                        <p>
                          {firstException.name} · {firstException.sku}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    className="button secondary"
                    disabled={!firstException}
                    onClick={() => {
                      setPage("Configuration")
                      setQuery(firstException?.sku || "")
                    }}
                  >
                    Review stock exception <Icon name="arrow" />
                  </Button>
                  <div className="operation-stat">
                    <span>Local size availability</span>
                    <strong>{availability}</strong>
                  </div>
                  <progress
                    className="availability-track"
                    value={variantStatuses.filter(Boolean).length}
                    max={variantStatuses.length || 1}
                    aria-label="Local size availability"
                  />
                  <div className="operation-stat">
                    <span>Catalogue source</span>
                    <span>
                      {catalogueSourceLabel}
                    </span>
                  </div>
                  <div className="operation-note">
                    {catalogue.source === "API"
                      ? "Read-only API snapshot · manual refresh"
                      : "No live API connection"}
                  </div>
                </section>
              </div>
            )}
            {page === "Configuration" && (
              <section className="panel inventory-configuration">
                <PanelTitle title="Inventory settings" />
                <div className="inventory-settings">
                  <div>
                    <span className="outfit-context-label">Source</span>
                    <strong>{catalogueSourceLabel}</strong>
                    <p>Add products and manage available units by size below. For externally managed inventory, import a CSV or connect a public HTTPS API.</p>
                    {catalogue.endpoint && <span className="inventory-endpoint">{catalogue.endpoint}</span>}
                  </div>
                  <label>
                    Automatic inventory refresh
                    <Select value={catalogue.source === "API" ? refreshInterval : 0}
                      disabled={catalogue.source !== "API"}
                      onChange={(e) => {
                        refreshSequence.current++
                        refreshRequest.current?.abort()
                        setSync("idle")
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
                  <span>{sync === "loading" ? "Updating inventory…" : sync === "error" ? "Update failed. Previous inventory retained." : `Last update: ${catalogue.updatedAt}`}</span>
                  <span>{catalogue.source === "API" && refreshInterval ? "Automatic refresh enabled" : "Manual updates"}</span>
                </div>
              </section>
            )}
            {page === "Configuration" && (
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
                        onClick={() => void refreshApi()}
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
                  <table
                    className="catalogue-table"
                    aria-label="Product catalogue"
                  >
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col">Category</th>
                        <th scope="col" className="numeric-cell">
                          Price
                        </th>
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
                              <span
                                className="inventory-dot"
                                aria-hidden="true"
                              />
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
                    `${p.name} ${p.sku}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
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
                          setCataloguePage((current) =>
                            Math.max(1, current - 1),
                          )
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        className="table-action"
                        disabled={cataloguePage >= cataloguePages}
                        onClick={() =>
                          setCataloguePage((current) =>
                            Math.min(cataloguePages, current + 1),
                          )
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
                    {catalogue.source !== "Sample"
                      ? catalogue.source === "API" && refreshInterval
                        ? "Local inventory snapshot · automatic refresh in this merchant tab"
                        : "Local catalogue snapshot · browser-tab storage · manual updates"
                      : "Import your CSV to use your own product data"}
                  </span>

                  {sync === "error" && (
                    <span role="alert">
                      API unavailable. Existing data retained; retry refresh.
                    </span>
                  )}
                </div>
              </section>
            )}

          </>
          <Footer note="Built-in products and analytics use sample data. CSV/API imports use your supplied catalogue; automatic API refresh runs only in the active merchant tab, not on a server. AI fitting and retailer checkout are not connected." />
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />
          {toast}
          <Button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" />
          </Button>
        </div>
      )}
    </div>
  )
}
function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [role, setRole] = useState<"customer" | "merchant">("customer")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [googleLoading, setGoogleLoading] = useState(false)
  const continueWithGoogle = () => {
    setError("")
    setGoogleLoading(true)
    // Demo stand-in for Google Identity Services: no real OAuth client here,
    // so simulate the redirect back with a Google-style profile.
    setTimeout(() => {
      setGoogleLoading(false)
      onLogin({
        name: "Google User",
        email: "google.user@gmail.com",
        role,
      })
    }, 900)
  }
  return (
    <div className="login-page">
      <header className="login-header">
        <div className="atelier-wordmark">Forma</div>
      </header>
      <main className="login-layout">
        <section className="login-story">
          <Heading level={1}>
            A better fit.
            <br />
            <span>For everyone.</span>
          </Heading>
          <div className="login-garments" aria-hidden="true">
            <Garment type="Top" />
            <Garment type="Bottom" />
            <Garment type="Footwear" />
          </div>
        </section>
        <section className="login-card" aria-label="Log in">
          <Heading level={2}>Welcome back.</Heading>
          <div className="look-tabs login-role" aria-label="Account type">
            {(["customer", "merchant"] as const).map((value) => (
              <Button
                key={value}
                aria-pressed={role === value}
                className={role === value ? "selected" : ""}
                onClick={() => {
                  setRole(value)
                  setError("")
                }}
              >
                {value === "customer" ? "Customer" : "Merchant"}
              </Button>
            ))}
          </div>
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              const account = identifier.trim()
              const isEmail = account.includes("@")
              if (!account) {
                setError("Enter your email address or username.")
                return
              }
              if (
                isEmail
                  ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)
                  : !/^[a-zA-Z0-9._-]{3,80}$/.test(account)
              ) {
                setError(
                  "Enter a valid email or a username of 3–80 letters, numbers, dots, underscores or hyphens.",
                )
                return
              }
              if (password !== "forma-demo") {
                setError(
                  'This demo uses the password "forma-demo". Do not use a real password.',
                )
                setPassword("")
                return
              }
              setPassword("")
              onLogin({
                name: isEmail ? account.split("@")[0] : account,
                email: isEmail ? account : "",
                role,
              })
            }}
          >
            <label htmlFor="login-identifier">Email address or username</label>
            <Input
              id="login-identifier"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              maxLength={254}
              required
              onChange={(e) => {
                setIdentifier(e.target.value)
                setError("")
              }}
              placeholder="you@example.com or username"
            />
            <label htmlFor="login-password">Password</label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-describedby="login-demo-help"
              value={password}
              required
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              placeholder="Enter password"
            />
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="button primary full">
              Log in as {role}
              <Icon name="arrow" />
            </Button>
          </Form>
          <div className="login-divider" aria-hidden="true">
            <span>or</span>
          </div>
          <Button
            className="button secondary full"
            disabled={googleLoading}
            onClick={continueWithGoogle}
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.4 7.5 24 12 24z" />
              <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.5-2.7-.1.1C.6 8.6 0 10.2 0 12s.6 3.4 1.5 4.9l3.7-2.5z" />
              <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.6 1.5 6.9l3.7 2.9c.9-2.9 3.6-5.1 6.8-5.1z" />
            </svg>
            {googleLoading ? "Connecting to Google…" : "Continue with Google"}
          </Button>
          <div className="login-demo-note" id="login-demo-help">
            <strong>Demo login only.</strong>
            <p>
              Use a sample email or username and password{" "}
              <strong>forma-demo</strong>. Passwords are never stored or sent.
              This local demo is not secure authentication; do not enter real
              credentials.
            </p>
          </div>
        </section>
      </main>
      <Footer
        className="login-footer"
        note="Local demo only. Passwords are never stored or transmitted."
      />
    </div>
  )
}
function PanelTitle({
  title,
  trailing,
}: {
  title: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="panel-header">
      <div>
        <Heading level={2}>{title}</Heading>
      </div>
      {trailing}
    </div>
  )
}
