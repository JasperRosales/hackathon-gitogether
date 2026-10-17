import { useEffect, useRef, useState } from "react"
import type { Product } from "@/lib/catalogue"
import {
  variantStock,
  catalogueSizes,
  productTotal,
} from "@/lib/catalogue"
import { compatible, recommendOutfit } from "@/lib/recommend"
import type { Preferences } from "@/lib/recommend"
import { Button, Input } from "@/components/ui"
import { Icon } from "@/components/Icon"
import Footer from "@/components/Footer"
import HomePage from "@/pages/customer/HomePage"
import OutfitPage from "@/pages/customer/OutfitPage"
import { useAppDispatch } from "@/lib/hooks"
import {
  setCategory as setCategoryAction,
  setSearch as setSearchAction,
  setBuilderMode as setBuilderModeAction,
} from "@/lib/store"
import type { BuilderMode, CartBundle, ShopIntent, ShopTab, ShopView } from "@/pages/customer/types"

/** Cart entries as stored; older hot-reload entries may miss newer fields. */
type StoredCartBundle = Omit<CartBundle, "quantities" | "selectedSkus"> & {
  quantity?: number
  quantities?: Record<string, number>
  selectedSkus?: string[]
}

export default function CustomerShop({
  products,
  image,
  session,
  onLogin,
  onLogout,
  notify,
}: {
  products: Product[]
  image: string
  session: { name: string } | null
  onLogin: () => void
  onLogout: () => void
  notify: (message: string) => void
}) {
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<ShopTab>("home")
  const [view, setView] = useState<ShopView>("collection")
  const [intent, setIntent] = useState<ShopIntent>("builder")
  const [builderMode, setBuilderMode] = useState<BuilderMode>("bundle")
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
          setView((["outfit", "fitting", "cart"] as const).includes(sub as "outfit" | "fitting" | "cart")
            ? sub as "outfit" | "fitting" | "cart"
            : "collection")
        }
      } else if (section === "product") {
        try { setProductSku(decodeURIComponent(path.slice(3).join("/"))) }
        catch { setProductSku("") }
        setTab("outfits")
        setView("product")
      } else if ((["outfit", "fitting", "cart"] as const).includes(section as "outfit" | "fitting" | "cart")) {
        // Legacy flat routes redirect into the Outfits page.
        setTab("outfits")
        setView(section as "outfit" | "fitting" | "cart")
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
  const detailProduct = products.find((p) => p.sku === productSku)
  const openProduct = (p: Product) => {
    setProductSku(p.sku)
    setTab("outfits")
    setView("product")
    window.location.hash = `/shop/outfits/product/${encodeURIComponent(p.sku)}`
    window.scrollTo(0, 0)
  }
  const [category, setCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [collectionPage, setCollectionPage] = useState(1)
  useEffect(() => setCollectionPage(1), [category, search, products])
  useEffect(() => {
    dispatch(setBuilderModeAction(builderMode))
  }, [builderMode, dispatch])
  useEffect(() => {
    dispatch(setCategoryAction(category))
  }, [category, dispatch])
  useEffect(() => {
    dispatch(setSearchAction(search))
  }, [search, dispatch])
  const [selected, setSelected] = useState<Product[]>([])
  const [preferencesExpanded, setPreferencesExpanded] = useState(false)
  const [prefs, setPrefs] = useState<Preferences>({
    size: catalogueSizes(products).includes("M")
      ? "M"
      : catalogueSizes(products)[0] || "M",
    style: "Minimal",
    occasion: "Everyday",
    palette: "Any color",
    budget: 15000,
    accessories: false,
  })
  const [bundle, setBundle] = useState<Product[]>([])
  const [error, setError] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [activePhoto, setActivePhoto] = useState<number | null>(null)
  const activeModelSrc = activePhoto !== null && photos[activePhoto] ? photos[activePhoto] : null
  const [previewState, setPreviewState] = useState("idle")
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
    if (delta > 0 && !canAddBundle([piece], entry.size)) return
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
  const canAddBundle = (items: Product[], size: string) => items.every((item) => {
    const current = products.find((p) => p.sku === item.sku)
    const reserved = cart.filter((entry) => entry.size === size)
      .reduce((sum, entry) => sum + (entry.quantities[item.sku] || 0), 0)
    return current && variantStock(current, size) >= reserved + items.filter((p) => p.sku === item.sku).length
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
  const go = (next: ShopView) => {
    setTab("outfits")
    setView(next)
    window.location.hash = next === "collection" ? "/shop/outfits" : `/shop/outfits/${next}`
    window.scrollTo(0, 0)
  }
  const updatePrefs = (patch: Partial<Preferences>) => {
    setPrefs((current) => ({ ...current, ...patch }))
    setError("")
    setBundle([])
    setPreviewState("idle")
    clearTimeout(previewTimer.current)
  }
  const isSelected = (product: Product) =>
    selected.some((p) => p.sku === product.sku)
  const togglePiece = (product: Product) => {
    const next = isSelected(product)
      ? selected.filter((p) => p.sku !== product.sku)
      : builderMode === "single" ? [product] : [...selected, product]
    setSelected(next)
    setError("")
    setBundle([])
    setPreviewState("idle")
    clearTimeout(previewTimer.current)
    if (next.length && next.some((p) => !variantStock(p, prefs.size))) {
      const commonSize = catalogueSizes(products).find((size) =>
        next.every((p) => variantStock(p, size) > 0),
      )
      if (commonSize) setPrefs((current) => ({ ...current, size: commonSize }))
      else
        setError(
          "Your selected pieces do not share an available size. Remove a piece or choose another combination.",
        )
    }
  }
  const total = productTotal(bundle)
  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()),
  )
  const build = () => {
    recommend(false)
  }
  const recommend = (navigate: boolean): boolean => {
    if (!selected.length) {
      setBundle([])
      setError("")
      return false
    }
    const currentSelection = selected.map((p) => products.find((current) => current.sku === p.sku)).filter((p): p is Product => Boolean(p))
    const validSingle = currentSelection.length === 1 && compatible(currentSelection[0], prefs) && productTotal(currentSelection) <= prefs.budget
    const result = currentSelection.length !== selected.length ? null
      : builderMode === "single" ? validSingle ? currentSelection : null
      : recommendOutfit(products, currentSelection, prefs)
    if (!result) {
      setError(
        builderMode === "single"
          ? "This piece is unavailable for your size, color preference or budget. Adjust your preferences or choose another piece."
          : "No complete outfit matches this size, color preference and budget. Try a higher budget, another size or any color.",
      )
      setBundle([])
      return false
    }
    setBundle(result)
    setError("")
    setPreviewState("idle")
    if (navigate) go("outfit")
    return true
  }
  const swap = (product: Product, index: number) => {
    const alternative = products.find(
      (p) =>
        p.sku !== product.sku &&
        !bundle.some((piece) => piece.sku === p.sku) &&
        p.category === product.category &&
        compatible(p, prefs) &&
        Math.round(total * 100) -
          Math.round(product.price * 100) +
          Math.round(p.price * 100) <=
          Math.round(prefs.budget * 100),
    )
    if (!alternative) {
      notify(
        "No other compatible in-stock item fits your size and remaining budget.",
      )
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
    if (!bundle.length || bundle.some((p) => !compatible(p, prefs)) || total > prefs.budget || !canAddBundle(bundle, prefs.size)) {
      notify(
        "Availability or budget changed. Rebuild your outfit before adding it.",
      )
      return
    }
    setCart((current) => [...current, {
      id: crypto.randomUUID(), items: bundle.map((p) => ({ ...p })), size: prefs.size,
      style: prefs.style, occasion: prefs.occasion,
      quantities: Object.fromEntries(bundle.map((p) => [p.sku, 1])), selectedSkus: [],
    }])
    notify(bundle.length === 1 ? "Piece added to your cart." : "Outfit added to your cart.")
  }
  const quickAdd = (product: Product) => {
    const current = products.find((p) => p.sku === product.sku)
    if (!current || !variantStock(current, prefs.size)) {
      notify("This piece is unavailable in your size. Pick another size or piece.")
      return
    }
    if (!canAddBundle([current], prefs.size)) {
      notify("No more units of this piece are available in your size.")
      return
    }
    setCart((prev) => [...prev, {
      id: crypto.randomUUID(), items: [{ ...current }], size: prefs.size,
      style: prefs.style, occasion: prefs.occasion,
      quantities: { [current.sku]: 1 }, selectedSkus: [current.sku],
    }])
    notify(`${current.name} added to your cart.`)
  }
  const buildTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(buildTimer.current), [])
  // Auto-recommend while working in the builder: picking pieces or tuning the
  // setting refreshes the outfit on the model with no extra taps.
  useEffect(() => {
    if (tab !== "outfits" || view !== "collection" || intent !== "builder") return
    clearTimeout(buildTimer.current)
    if (!selected.length) {
      setBundle([])
      return
    }
    buildTimer.current = setTimeout(() => {
      recommend(false)
    }, 600)
    return () => clearTimeout(buildTimer.current)
  }, [selected, prefs, builderMode, products, tab, view, intent])
  // Live fitting shimmer whenever a fresh outfit lands on the model.
  useEffect(() => {
    if (tab !== "outfits" || view !== "collection" || intent !== "builder") return
    if (!bundle.length) {
      setPreviewState("idle")
      return
    }
    setPreviewState("loading")
    previewTimer.current = setTimeout(() => setPreviewState("ready"), 900)
    return () => clearTimeout(previewTimer.current)
  }, [bundle, tab, view, intent])
  return (
    <div className={`customer-storefront shop-storefront ${view === "outfit" || view === "fitting" ? "has-outfit-dock" : ""} ${view === "collection" && selected.length ? "has-preference-sheet" : ""}`}>
      <header className="customer-nav">
        <Button
          className="atelier-wordmark storefront-home"
          aria-label="Forma — home"
          onClick={() => goTab("home")}
        >
          Forma
        </Button>
        <nav className="shop-navigation" aria-label="Shop pages">
          {(["home", "outfits"] as const).map((t) => (
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
          <HomePage
            image={image}
            category={category}
            setCategory={setCategory}
            onStartBuilder={() => { setIntent("builder"); setBuilderMode("bundle"); go("collection") }}
            onStyleSingle={() => {
              setIntent("builder")
              setBuilderMode("single")
              setSelected((current) => current.slice(0, 1))
              setBundle([])
              go("collection")
            }}
            onShopPurchase={() => { setIntent("purchase"); setBundle([]); setError(""); go("collection") }}
          />
        )}
        {tab === "outfits" && (
          <OutfitPage
            products={products}
            image={image}
            notify={notify}
            view={view}
            go={go}
            intent={intent}
            setIntent={setIntent}
            builderMode={builderMode}
            setBuilderMode={setBuilderMode}
            selected={selected}
            setSelected={setSelected}
            isSelected={isSelected}
            togglePiece={togglePiece}
            category={category}
            setCategory={setCategory}
            search={search}
            setSearch={setSearch}
            prefs={prefs}
            updatePrefs={updatePrefs}
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
            quickAdd={quickAdd}
            swap={swap}
            build={build}
            photos={photos}
            activePhoto={activePhoto}
            setActivePhoto={setActivePhoto}
            activeModelSrc={activeModelSrc}
            removePhoto={removePhoto}
            upload={upload}
            preferencesExpanded={preferencesExpanded}
            setPreferencesExpanded={setPreferencesExpanded}
          />
        )}
        <Footer note="Recommendations use catalogue rules and known size stock. Photos stay in this browser; AI fitting and retailer checkout are not connected. Inventory freshness depends on the merchant connection." />
      </main>
    </div>
  )
}
