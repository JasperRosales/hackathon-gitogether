import { lazy, Suspense, useEffect, useRef, useState } from "react"
import type { Product } from "@/lib/catalogue"
import { productTotal } from "@/lib/catalogue"
import { compatible, recommendOutfit } from "@/lib/recommend"
import type { Preferences } from "@/lib/recommend"
import { recommendOutfitFromPhoto } from "@/lib/photoStylist"
import { isVisionConfigured } from "@/lib/aiConfig"
import type { AssistantActions } from "@/components/StylistChat"
import { Button, Input } from "@/components/ui"
import { Icon } from "@/components/Icon"
import Footer from "@/components/Footer"
import { useAppDispatch } from "@/lib/hooks"
import { setCategory as setCategoryAction } from "@/lib/store"
import type { CartBundle, ShopTab, ShopView } from "@/pages/customer/types"

const HomePage = lazy(() => import("@/pages/customer/HomePage"))
const OutfitPage = lazy(() => import("@/pages/customer/OutfitPage"))

/** Cart entries as stored; older hot-reload entries may miss newer fields. */
type StoredCartBundle = Omit<CartBundle, "quantities" | "selectedSkus"> & {
  quantity?: number
  quantities?: Record<string, number>
  selectedSkus?: string[]
}

/** Model photos are object URLs; the AI service needs a data URL. */
async function toDataUrl(src: string): Promise<string> {
  const response = await fetch(src)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read the model photo."))
    reader.readAsDataURL(blob)
  })
}

const pendingOutfitKey = "forma-pending-outfit-v1"

const LANDING_SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "team", label: "Team" },
  { id: "links", label: "Links" },
] as const

function readPendingOutfit(): { selected: Product[]; bundle: Product[] } | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(pendingOutfitKey) || "null")
    if (value && Array.isArray(value.selected) && Array.isArray(value.bundle))
      return { selected: value.selected, bundle: value.bundle }
  } catch {
    /* Invalid storage is ignored. */
  }
  return null
}

function savePendingOutfit(selected: Product[], bundle: Product[]) {
  try {
    sessionStorage.setItem(
      pendingOutfitKey,
      JSON.stringify({ selected, bundle }),
    )
  } catch {
    /* Selection is lost across the login detour if storage is blocked. */
  }
}

function clearPendingOutfit() {
  try {
    sessionStorage.removeItem(pendingOutfitKey)
  } catch {
    /* Nothing to clear. */
  }
}

export default function CustomerShop({
  products,
  image,
  session,
  onLogin,
  onLogout,
  notify,
  onAssistantActions,
  onRequireLogin,
}: {
  products: Product[]
  image: string
  session: { name: string } | null
  onLogin: () => void
  onLogout: () => void
  notify: (message: string) => void
  onAssistantActions?: (actions: AssistantActions | null) => void
  onRequireLogin?: () => void
}) {
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<ShopTab>("home")
  const [activeLandingSection, setActiveLandingSection] = useState<
    (typeof LANDING_SECTIONS)[number]["id"]
  >("home")
  const [view, setView] = useState<ShopView>("collection")
  const [productSku, setProductSku] = useState("")
  useEffect(() => {
    const readLocation = () => {
      const path = window.location.hash.slice(1).split("/")
      if (path[1] !== "shop") return
      const section = path[2]
      if (!section || section === "setting") {
        // "/shop/setting" is a legacy route; the settings page no longer exists.
        setTab("home")
      } else if (section === "outfits") {
        setTab("outfits")
        const sub = path[3]
        if (sub === "product") {
          try { setProductSku(decodeURIComponent(path.slice(4).join("/"))) }
          catch { setProductSku("") }
          setView("product")
        } else {
          setView((["fitting", "cart"] as const).includes(sub as "fitting" | "cart")
            ? sub as "fitting" | "cart"
            : "collection")
        }
      } else if (section === "product") {
        try { setProductSku(decodeURIComponent(path.slice(3).join("/"))) }
        catch { setProductSku("") }
        setTab("outfits")
        setView("product")
      } else if ((["fitting", "cart"] as const).includes(section as "fitting" | "cart")) {
        // Legacy flat routes redirect into the Outfits page.
        setTab("outfits")
        setView(section as "fitting" | "cart")
      } else if (section === "builder" || section === "collection") {
        setTab("outfits")
        setView("collection")
      } else {
        setTab("home")
      }
      window.scrollTo(0, 0)
    }
    readLocation()
    window.addEventListener("hashchange", readLocation)
    return () => window.removeEventListener("hashchange", readLocation)
  }, [])
  useEffect(() => {
    if (tab !== "home") return

    const updateActiveSection = () => {
      const headerOffset = 96
      const sections = LANDING_SECTIONS.map(({ id }) => ({
        id,
        top: document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      }))
      const current = sections.reduce(
        (active, section) => (section.top <= headerOffset ? section.id : active),
        "home" as (typeof LANDING_SECTIONS)[number]["id"],
      )
      setActiveLandingSection((active) => (active === current ? active : current))
    }

    updateActiveSection()
    window.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)
    return () => {
      window.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [tab])
  const detailProduct = products.find((p) => p.sku === productSku)
  const openProduct = (p: Product) => {
    setProductSku(p.sku)
    setTab("outfits")
    setView("product")
    window.location.hash = `/shop/outfits/product/${encodeURIComponent(p.sku)}`
    window.scrollTo(0, 0)
  }
  const [category, setCategory] = useState("All")
  const [collectionPage, setCollectionPage] = useState(1)
  useEffect(() => setCollectionPage(1), [category, products])
  useEffect(() => {
    dispatch(setCategoryAction(category))
  }, [category, dispatch])
  const pendingOutfit = useRef<
    { selected: Product[]; bundle: Product[] } | null | undefined
  >(undefined)
  if (pendingOutfit.current === undefined)
    pendingOutfit.current = readPendingOutfit()
  const [selected, setSelected] = useState<Product[]>(
    () => pendingOutfit.current?.selected ?? [],
  )
  const [prefs] = useState<Preferences>({
    style: "Minimal",
    occasion: "Everyday",
    palette: "Any color",
    accessories: false,
  })
  const [bundle, setBundle] = useState<Product[]>(
    () => pendingOutfit.current?.bundle ?? [],
  )
  const [error, setError] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [activePhoto, setActivePhoto] = useState<number | null>(null)
  const activeModelSrc = activePhoto !== null && photos[activePhoto] ? photos[activePhoto] : null
  const [previewState, setPreviewState] = useState("idle")
  const [photoReco, setPhotoReco] = useState<{
    status: "idle" | "loading" | "error"
    warnings: string[]
    error: string
    note: string
  }>({ status: "idle", warnings: [], error: "", note: "" })
  const visionConfigured = isVisionConfigured()
  const [cartState, setCart] = useState<StoredCartBundle[]>([])
  // Hot reload can retain bundles created before piece selection was added.
  const cart: CartBundle[] = cartState.map((entry) => ({
    ...entry,
    selectedSkus: Array.isArray(entry.selectedSkus) ? entry.selectedSkus : [],
    quantities: Object.fromEntries(entry.items.map((p) => [p.sku, entry.quantities?.[p.sku] ?? entry.quantity ?? 1])),
  }))
  const cartItemCount = cart.reduce((sum, entry) => sum + entry.items.reduce((count, p) => count + entry.quantities[p.sku], 0), 0)
  const cartBundleCount = cart.length
  const selectedCartItems = cart.reduce((sum, entry) => sum + entry.selectedSkus.reduce((count, sku) => count + entry.quantities[sku], 0), 0)
  const selectedCartBundles = cart.filter((entry) => entry.selectedSkus.length > 0).length
  const bundleSubtotal = (entry: CartBundle, selectedOnly = false) =>
    entry.items.reduce((sum, p) => sum + (!selectedOnly || entry.selectedSkus.includes(p.sku) ? Math.round(p.price * 100) * entry.quantities[p.sku] : 0), 0) / 100
  const cartTotal = cart.reduce((sum, entry) => sum + Math.round(bundleSubtotal(entry, true) * 100), 0) / 100
  const changePieceQuantity = (id: string, sku: string, delta: number) => {
    const entry = cart.find((b) => b.id === id)
    const piece = entry?.items.find((p) => p.sku === sku)
    if (!entry || !piece || entry.quantities[sku] + delta < 1) return
    if (delta > 0 && !canAddBundle([piece])) return
    setCart((current) => current.map((b) => b.id === id
      ? { ...b, quantities: { ...entry.quantities, [sku]: entry.quantities[sku] + delta } } : b))
  }
  const selectCartPieces = (id: string, skus: string[]) => {
    setCart((current) => current.map((entry) => entry.id === id ? { ...entry, selectedSkus: skus } : entry))
  }
  const removeBundle = (id: string) => {
    setCart((current) => current.filter((entry) => entry.id !== id))
  }
  const money = (amount: number) => `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const canAddBundle = (items: Product[]) => items.every((item) => {
    const current = products.find((p) => p.sku === item.sku)
    const reserved = cart.reduce((sum, entry) => sum + (entry.quantities[item.sku] || 0), 0)
    return current && current.stock >= reserved + items.filter((p) => p.sku === item.sku).length
  })
  const upload = useRef<HTMLInputElement>(null)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  useEffect(() => () => clearTimeout(previewTimer.current), [])
  useEffect(
    () => () => {
      photos.forEach((src) => URL.revokeObjectURL(src))
    },
    // Revoke all uploaded model photos when the shop unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const removePhoto = (index: number) => {
    setPhotos((current) => {
      const src = current[index]
      if (src) URL.revokeObjectURL(src)
      return current.filter((_, i) => i !== index)
    })
    setActivePhoto((current) => {
      if (current === null) return null
      if (current === index) return null
      return current > index ? current - 1 : current
    })
    setPreviewState("idle")
  }
  const goTab = (next: ShopTab) => {
    setTab(next)
    window.location.hash = next === "home" ? "/shop" : "/shop/outfits"
    window.scrollTo(0, 0)
  }
  const goLandingSection = (id: (typeof LANDING_SECTIONS)[number]["id"]) => {
    goTab("home")
    window.setTimeout(() => {
      const section = document.getElementById(id)
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      section?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      })
    }, 0)
  }
  const go = (next: ShopView) => {
    setTab("outfits")
    setView(next)
    window.location.hash = next === "collection" ? "/shop/outfits" : `/shop/outfits/${next}`
    window.scrollTo(0, 0)
  }
  const isSelected = (product: Product) =>
    selected.some((p) => p.sku === product.sku)
  const togglePiece = (product: Product) => {
    const next = isSelected(product)
      ? selected.filter((p) => p.sku !== product.sku)
      : [...selected, product]
    setSelected(next)
    setError("")
    setBundle([])
    setPreviewState("idle")
    clearTimeout(previewTimer.current)
  }
  const total = productTotal(bundle)
  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category),
  )
  const recommend = () => {
    if (!selected.length) {
      setBundle([])
      setError("")
      return
    }
    const currentSelection = selected.map((p) => products.find((current) => current.sku === p.sku)).filter((p): p is Product => Boolean(p))
    const result = currentSelection.length !== selected.length ? null : recommendOutfit(products, currentSelection, prefs)
    if (!result) {
      setError(
        "No complete outfit could be built from this selection. The catalogue may be missing a matching piece in one of the categories.",
      )
      setBundle([])
      return
    }
    setBundle(result)
    setError("")
    setPreviewState("idle")
  }
  const swap = (product: Product, index: number) => {
    const alternative = products.find(
      (p) =>
        p.sku !== product.sku &&
        !bundle.some((piece) => piece.sku === p.sku) &&
        p.category === product.category &&
        compatible(p, prefs),
    )
    if (!alternative) {
      notify("No other compatible in-stock piece is available.")
      return
    }
    setBundle((current) =>
      current.map((p, i) => (i === index ? alternative : p)),
    )
    if (isSelected(product))
      setSelected((current) =>
        current.map((p) => (p.sku === product.sku ? alternative : p)),
      )
    setPreviewState("idle")
    clearTimeout(previewTimer.current)
  }
  const addCart = () => {
    if (!bundle.length || bundle.some((p) => !compatible(p, prefs)) || !canAddBundle(bundle)) {
      notify(
        "Availability changed. Rebuild your outfit before adding it.",
      )
      return
    }
    setCart((current) => [...current, {
      id: crypto.randomUUID(), items: bundle.map((p) => ({ ...p })),
      style: prefs.style, occasion: prefs.occasion,
      quantities: Object.fromEntries(bundle.map((p) => [p.sku, 1])), selectedSkus: [],
    }])
    notify(bundle.length === 1 ? "Piece added to your cart." : "Outfit added to your cart.")
  }
  // Per-product add: drop a single piece into the cart as its own line.
  const addCartItem = (product: Product) => {
    const piece = products.find((p) => p.sku === product.sku)
    if (!piece || !piece.stock) {
      notify("This piece is unavailable.")
      return
    }
    if (!canAddBundle([piece])) {
      notify("No more units of this piece are available.")
      return
    }
    setCart((current) => [...current, {
      id: crypto.randomUUID(), items: [{ ...piece }],
      style: prefs.style, occasion: prefs.occasion,
      quantities: { [piece.sku]: 1 }, selectedSkus: [piece.sku],
    }])
    notify(`${piece.name} added to your cart.`)
  }
  const runPhotoRecommendation = async () => {
    if (!activeModelSrc) {
      notify("Upload a model photo in the fitting studio first.")
      return
    }
    setPhotoReco({ status: "loading", warnings: [], error: "", note: "" })
    try {
      const dataUrl = await toDataUrl(activeModelSrc)
      const result = await recommendOutfitFromPhoto(products, dataUrl, {
        preferences: {
          style: prefs.style,
          occasion: prefs.occasion,
          palette: prefs.palette,
        },
      })
      const items = result.items
        .map((item) => products.find((p) => p.sku === item.sku))
        .filter((p): p is Product => Boolean(p))
      setBundle(items)
      setError("")
      setPreviewState("idle")
      clearTimeout(previewTimer.current)
      setPhotoReco({
        status: "idle",
        warnings: result.warnings,
        error: "",
        note: result.items.length
          ? ""
          : result.reasoning?.trim() ||
            result.analysis?.trim() ||
            "The stylist could not build a complete look from the catalogue.",
      })
    } catch (cause) {
      setPhotoReco({
        status: "error",
        warnings: [],
        error:
          cause instanceof Error ? cause.message : "AI recommendation failed.",
        note: "",
      })
    }
  }
  const assistantActionsRef = useRef({
    addToOutfit: togglePiece,
    addToCart: addCartItem,
  })
  assistantActionsRef.current = {
    addToOutfit: togglePiece,
    addToCart: addCartItem,
  }
  useEffect(() => {
    if (!onAssistantActions) return
    onAssistantActions({
      addToOutfit: (product) => assistantActionsRef.current.addToOutfit(product),
      addToCart: (product) => assistantActionsRef.current.addToCart(product),
    })
    return () => onAssistantActions(null)
  }, [onAssistantActions])
  useEffect(() => {
    if (pendingOutfit.current) clearPendingOutfit()
    // The pending selection is consumed once, on the mount after login.
  }, [])
  const requestLoginForFitting = () => {
    savePendingOutfit(selected, bundle)
    if (onRequireLogin) onRequireLogin()
    else onLogin()
  }
  const buildTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(buildTimer.current), [])
  // Auto-recommend while working in the builder: picking pieces or tuning the
  // setting refreshes the outfit on the model with no extra taps.
  useEffect(() => {
    if (tab !== "outfits" || view !== "collection") return
    clearTimeout(buildTimer.current)
    if (!selected.length) {
      setBundle([])
      return
    }
    buildTimer.current = setTimeout(() => {
      recommend()
    }, 600)
    return () => clearTimeout(buildTimer.current)
  }, [selected, prefs, products, tab, view])
  // Live fitting shimmer whenever a fresh outfit lands on the model.
  useEffect(() => {
    if (tab !== "outfits" || view !== "collection") return
    if (!bundle.length) {
      setPreviewState("idle")
      return
    }
    setPreviewState("loading")
    previewTimer.current = setTimeout(() => setPreviewState("ready"), 900)
    return () => clearTimeout(previewTimer.current)
  }, [bundle, tab, view])
  return (
    <div className={`customer-storefront shop-storefront ${view === "fitting" ? "has-outfit-dock" : ""}`}>
      <header className="customer-nav">
        <Button
          className="atelier-wordmark storefront-home"
          aria-label="Forma — home"
          onClick={() => goTab("home")}
        >
          Forma
        </Button>
        <nav className="shop-navigation" aria-label={tab === "home" ? "Landing sections" : "Shop pages"}>
          {tab === "home"
            ? LANDING_SECTIONS.map(({ id, label }) => (
                <Button
                  key={id}
                  className={activeLandingSection === id ? "active" : ""}
                  aria-current={activeLandingSection === id ? "true" : undefined}
                  onClick={() => goLandingSection(id)}
                >
                  {label}
                </Button>
              ))
            : (["home", "outfits"] as const).map((t) => (
                <Button
                  key={t}
                  className={tab === t ? "active" : ""}
                  aria-pressed={tab === t}
                  onClick={() => goTab(t)}
                >
                  {t === "home" ? "Home" : "Outfits"}
                </Button>
              ))}
        </nav>
        <div className="customer-account">
          {(session || tab !== "home") && (
            <Button
              className="shop-cart-button"
              aria-label={`Cart, ${cartItemCount} items in ${cartBundleCount} bundles`}
              onClick={() => go("cart")}
            >
              <Icon name="bag" />
              <span>{cartItemCount}</span>
            </Button>
          )}
          {session && <span className="account-name">{session.name}</span>}
          <Button
            className={session ? "logout-button" : "button secondary"}
            onClick={session ? onLogout : onLogin}
          >
            {session && <Icon name="logout" />}
            {session ? "Log out" : "Log in"}
          </Button>
        </div>
      </header>
      <Input
        ref={upload}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 10 * 1024 * 1024
          ) {
            notify("Use a JPG, PNG or WebP under 10 MB.")
            return
          }
          setPhotos((current) => {
            const next = [...current, URL.createObjectURL(file)]
            setActivePhoto(next.length - 1)
            return next
          })
          setPreviewState("idle")
          clearTimeout(previewTimer.current)
        }}
      />
      <main className="customer-main">
        {tab === "home" && (
          <Suspense fallback={<div className="import-placeholder" role="status">Loading…</div>}>
            <HomePage onStartBuilder={() => { go("collection") }} />
          </Suspense>
        )}
        {tab === "outfits" && (
          <Suspense fallback={<div className="import-placeholder" role="status">Loading…</div>}>
          <OutfitPage
            products={products}
            image={image}
            notify={notify}
            view={view}
            go={go}
            selected={selected}
            setSelected={setSelected}
            isSelected={isSelected}
            togglePiece={togglePiece}
            bundle={bundle}
            setBundle={setBundle}
            total={total}
            error={error}
            setError={setError}
            previewState={previewState}
            setPreviewState={setPreviewState}
            previewTimer={previewTimer}
            filtered={filtered}
            collectionPage={collectionPage}
            setCollectionPage={setCollectionPage}
            openProduct={openProduct}
            detailProduct={detailProduct}
            cart={cart}
            cartTotal={cartTotal}
            selectedCartItems={selectedCartItems}
            selectedCartBundles={selectedCartBundles}
            money={money}
            bundleSubtotal={bundleSubtotal}
            canAddBundle={canAddBundle}
            changePieceQuantity={changePieceQuantity}
            selectCartPieces={selectCartPieces}
            removeBundle={removeBundle}
            addCart={addCart}
            addCartItem={addCartItem}
            swap={swap}
            photos={photos}
            activePhoto={activePhoto}
            setActivePhoto={setActivePhoto}
            activeModelSrc={activeModelSrc}
            removePhoto={removePhoto}
            upload={upload}
            photoReco={photoReco}
            photoConfigured={visionConfigured}
            hasModelPhoto={Boolean(activeModelSrc)}
            runPhotoRecommendation={runPhotoRecommendation}
            signedIn={Boolean(session)}
            onRequireLogin={requestLoginForFitting}
          />
          </Suspense>
        )}
        <Footer note="Recommendations use catalogue rules and available stock. Photos stay in this browser; AI fitting and retailer checkout are not connected. Inventory freshness depends on the merchant connection." />
      </main>
    </div>
  )
}
