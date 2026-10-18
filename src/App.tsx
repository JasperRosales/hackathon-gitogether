import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { useDispatch } from "react-redux"
import { Button, Heading } from "./components/ui"
import { Icon } from "./components/Icon"
import Footer from "./components/Footer"
import type { AssistantActions } from "./components/StylistChat"
import fittingModel from "./assets/fitting-fashion-model.jpg"
import {
  setSession as setSessionAction,
  clearSession as clearSessionAction,
} from "./lib/store"
import { useCatalogue } from "./lib/useCatalogue"
import {
  readSession,
  storeSession,
  clearStoredSession,
  initials,
} from "./lib/session"
import type { Session } from "./lib/session"

const CustomerShop = lazy(() => import("./components/CustomerShop"))
const StylistChat = lazy(() => import("./components/StylistChat"))
const LoginPage = lazy(() => import("./pages/LoginPage"))
const HomeDashboard = lazy(() => import("./pages/admin/HomeDashboard"))
const InventoryDashboard = lazy(() => import("./pages/admin/InventoryDashboard"))

const image = fittingModel

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

type AdminPage = "home" | "inventory"

const loadingFallback = (
  <div className="route-loading" role="status">
    Loading…
  </div>
)

export default function App() {
  const dispatch = useDispatch()
  const [session, setSession] = useState<Session | null>(readSession)
  useEffect(() => {
    if (session) dispatch(setSessionAction(session))
    else dispatch(clearSessionAction())
  }, [session, dispatch])
  const [route, setRoute] = useState(window.location.hash || "#/shop")
  useEffect(() => {
    const handleRoute = () => {
      setRoute(window.location.hash || "#/shop")
    }
    window.addEventListener("hashchange", handleRoute)
    return () => window.removeEventListener("hashchange", handleRoute)
  }, [])
  const navigate = (path: string) => {
    window.location.hash = path
    setRoute(`#${path}`)
    window.scrollTo(0, 0)
  }
  const [toast, setToast] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const notify = (text: string) => {
    clearTimeout(timer.current)
    setToast(text)
    timer.current = setTimeout(() => setToast(""), 4000)
  }
  const [adminPage, setAdminPage] = useState<AdminPage>("home")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [query, setQuery] = useState("")
  const [period, setPeriod] = useState("Last 30 days")
  const [assistantActions, setAssistantActions] =
    useState<AssistantActions | null>(null)
  const [postLoginRoute, setPostLoginRoute] = useState<string | null>(null)
  const requireLogin = (returnTo: string) => {
    setPostLoginRoute(returnTo)
    navigate("/login")
  }
  // InventoryDashboard reports whether a modal is open; the catalogue hook
  // reads this ref before running any background work.
  const busyRef = useRef<() => boolean>(() => false)
  const api = useCatalogue({
    notify,
    isBusy: () => busyRef.current(),
    active: route === "#/merchant" && session?.role === "merchant",
  })
  const { products, catalogue } = api
  const sourceLabel =
    catalogue.source === "None"
      ? "No catalogue yet"
      : catalogue.source === "AI"
        ? "AI-classified photos"
        : catalogue.source === "API"
          ? "API connection"
          : catalogue.source === "CSV"
            ? "CSV import"
            : "Manual inventory"
  const login = (account: Session) => {
    storeSession(account)
    setSession(account)
    setToast("")
    setAdminPage("home")
    const target =
      account.role === "merchant" ? "/merchant" : postLoginRoute ?? "/shop"
    setPostLoginRoute(null)
    navigate(target)
  }
  const logout = () => {
    clearStoredSession()
    setSession(null)
    setToast("")
    setAdminPage("home")
    setQuery("")
    navigate("/login")
  }
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
    return (
      <Suspense fallback={loadingFallback}>
        <LoginPage onLogin={login} />
      </Suspense>
    )
  if (route !== "#/merchant")
    return (
      <Suspense fallback={loadingFallback}>
      <div className="customer-page">
        <CustomerShop
          products={products}
          image={image}
          session={session}
          onLogin={() => navigate("/login")}
          onLogout={logout}
          notify={notify}
          onAssistantActions={setAssistantActions}
          onRequireLogin={() => requireLogin("/shop/outfits/fitting")}
        />
        <StylistChat
          products={products}
          actions={assistantActions}
          onOpenShop={() => navigate("/shop")}
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
      </Suspense>
    )
  return (
    <Suspense fallback={loadingFallback}>
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
      <aside className="sidebar" aria-label="Admin workspace">
        <div className="brand">
          <span className="forma-mark">f.</span>
          {!sidebarCollapsed && <span className="brand-name">Forma</span>}
          <Button className="icon-button sidebar-toggle"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed} aria-controls="admin-navigation"
            onClick={() => setSidebarCollapsed((current) => !current)}>
            <Icon name="sidebar" />
          </Button>
        </div>
        <nav id="admin-navigation" aria-label="Admin navigation">
          {([
            ["home", "Home", "grid"],
            ["inventory", "Inventory", "catalogue"],
          ] as const).map(([id, label, icon]) => (
            <Button
              key={id}
              className={`nav-item ${adminPage === id ? "active" : ""}`}
              aria-label={label}
              title={label}
              aria-current={adminPage === id ? "page" : undefined}
              onClick={() => setAdminPage(id)}
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
          <div className={`page-heading ${adminPage === "home" ? "overview-heading" : ""}`}>
            <div>
              <Heading level={1}>{adminPage === "home" ? "Home dashboard" : "Inventory dashboard"}</Heading>
            </div>
          </div>
          {adminPage === "home" ? (
            <HomeDashboard
              products={products}
              catalogue={catalogue}
              sourceLabel={sourceLabel}
              period={period}
              setPeriod={setPeriod}
              onOpenInventory={() => setAdminPage("inventory")}
              onReviewProduct={(sku) => {
                setAdminPage("inventory")
                setQuery(sku)
              }}
            />
          ) : (
            <InventoryDashboard
              api={api}
              sourceLabel={sourceLabel}
              query={query}
              setQuery={setQuery}
              busyRef={busyRef}
            />
          )}
          <Footer note="Products come from manual entries or AI photo classification in this browser tab; dashboard analytics use illustrative sample figures. AI fitting and retailer checkout are not connected." />
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
    </Suspense>
  )
}
