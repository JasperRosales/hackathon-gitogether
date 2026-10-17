import { useEffect, useRef, useState } from "react"
import type { ComponentType } from "react"
import { Button, Form, Heading, Input, Select } from "./ui"
import Footer from "./Footer"
import ExperienceLanding from "./ExperienceLanding"
import ProductImage from "./ProductImage"
import { useAppDispatch } from "@/lib/hooks"
import { setCategory as setCategoryAction, setSearch as setSearchAction, setBuilderMode as setBuilderModeAction } from "@/lib/store"
import {
  variantStock,
  catalogueSizes,
  productColor,
  productTotal,
  productSizes,
} from "../lib/catalogue"
import type { Product } from "../lib/catalogue"
export { variantStock } from "../lib/catalogue"

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

type Preferences = {
  size: string
  style: string
  occasion: string
  palette: string
  budget: number
  accessories: boolean
}
type CartBundle = {
  id: string
  items: Product[]
  size: string
  style: string
  occasion: string
  quantity?: number
  quantities?: Record<string, number>
  selectedSkus: string[]
}
function compatible(product: Product, prefs: Preferences) {
  const dark = /black|navy|charcoal|espresso|dark|brown/i.test(
    productColor(product),
  )
  const light = /white|cream|sand|stone|beige|ivory|light|gr[ae]y/i.test(
    productColor(product),
  )
  return (
    variantStock(product, prefs.size) > 0 &&
    (["Any neutral", "Any color"].includes(prefs.palette) ||
      (prefs.palette === "Light neutrals" ? light : dark))
  )
}
export function recommendOutfit(
  products: Product[],
  selected: Product | Product[],
  prefs: Preferences,
): Product[] | null {
  const selectedPieces = Array.isArray(selected) ? selected : [selected]
  if (
    !selectedPieces.length ||
    !Number.isFinite(prefs.budget) ||
    prefs.budget <= 0 ||
    selectedPieces.some((p) => !compatible(p, prefs)) ||
    productTotal(selectedPieces) > prefs.budget ||
    new Set(selectedPieces.map((p) => p.sku)).size !== selectedPieces.length
  )
    return null
  const categories = ["Top", "Bottom", "Footwear"]
  if (
    prefs.accessories ||
    selectedPieces.some((p) => p.category === "Accessory")
  )
    categories.push("Accessory")
  if (selectedPieces.some((p) => p.category === "Outerwear"))
    categories.unshift("Outerwear")
  const productScore = (p: Product) =>
    (prefs.occasion === "Work" && /shirt|loafer|oxford/i.test(p.name) ? 3 : 0) +
    (prefs.occasion === "Weekend" && /sneaker|canvas/i.test(p.name) ? 3 : 0) +
    (prefs.style === "Minimal" && /vest/i.test(p.name) ? 2 : 0) +
    (prefs.style === "Tailored" && /shirt/i.test(p.name) ? 2 : 0)
  const groups = categories.map((category) => {
    const fixed = selectedPieces.filter((p) => p.category === category)
    if (fixed.length) return [fixed]
    // A costlier item with the same preference score cannot improve the result.
    const bestByScore = new Map<number, Product>()
    for (const p of products) {
      if (p.category !== category || !compatible(p, prefs)) continue
      const score = productScore(p),
        best = bestByScore.get(score)
      if (!best || p.price < best.price) bestByScore.set(score, p)
    }
    return Array.from(bestByScore.values()).map((p) => [p])
  })
  if (groups.some((group) => !group.length)) return null
  let candidates: Product[][] = [[]]
  for (const group of groups)
    candidates = candidates.flatMap((bundle) =>
      group.map((pieces) => [...bundle, ...pieces]),
    )
  const score = (bundle: Product[]) =>
    bundle.reduce((sum, p) => sum + productScore(p), 0)
  return (
    candidates
      .filter((bundle) => productTotal(bundle) <= prefs.budget)
      .sort(
        (a, b) => score(b) - score(a) || productTotal(a) - productTotal(b),
      )[0] || null
  )
}

export default function CustomerShop({
  products,
  image,
  Icon,
  Garment,
  session,
  onLogin,
  onLogout,
  notify,
}: {
  products: Product[]
  image: string
  Icon: ComponentType<{ name: string }>
  Garment: ComponentType<{ type: string }>
  session: { name: string } | null
  onLogin: () => void
  onLogout: () => void
  notify: (message: string) => void
}) {
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<"home" | "outfits" | "setting">("home")
  const [settingSection, setSettingSection] = useState<"profile" | "photos" | "account">("profile")
  const [view, setView] =
    useState<"collection" | "outfit" | "fitting" | "cart" | "product">("collection")
  const [intent, setIntent] = useState<"purchase" | "builder">("builder")
  const [builderMode, setBuilderMode] = useState<"single" | "bundle">("bundle")
  const [productSku, setProductSku] = useState("")
  const subViews = ["collection", "outfit", "fitting", "cart", "product"] as const
  useEffect(() => {
    const readLocation = () => {
      const path = window.location.hash.slice(1).split("/")
      if (path[1] !== "shop") return
      const section = path[2]
      if (!section) {
        setTab("home")
      } else if (section === "setting") {
        setTab("setting")
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
  const [cartState, setCart] = useState<CartBundle[]>([])
  // Hot reload can retain bundles created before piece selection was added.
  const cart = cartState.map((entry) => ({
    ...entry,
    selectedSkus: Array.isArray(entry.selectedSkus) ? entry.selectedSkus : [],
    quantities: Object.fromEntries(entry.items.map((p) => [p.sku, entry.quantities?.[p.sku] ?? entry.quantity ?? 1])),
  }))
  const cartItemCount = cart.reduce((sum, entry) => sum + entry.items.reduce((count, p) => count + entry.quantities[p.sku], 0), 0)
  const cartBundleCount = cart.length
  const selectedCartItems = cart.reduce((sum, entry) => sum + entry.selectedSkus.reduce((count, sku) => count + entry.quantities[sku], 0), 0)
  const selectedCartBundles = cart.filter((entry) => entry.selectedSkus.length > 0).length
  const bundleSubtotal = (entry: typeof cart[number], selectedOnly = false) =>
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
  const goTab = (next: typeof tab) => {
    setTab(next)
    window.location.hash = next === "home" ? "/shop" : next === "setting" ? "/shop/setting" : "/shop/outfits"
    window.scrollTo(0, 0)
  }
  const go = (next: typeof view) => {
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
  const collectionPages = Math.max(1, Math.ceil(filtered.length / 12))
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
          {(["home", "outfits", "setting"] as const).map((t) => (
            <Button
              key={t}
              className={tab === t ? "active" : ""}
              aria-pressed={tab === t}
              onClick={() => goTab(t)}
            >
              {t === "home" ? "Home" : t === "outfits" ? "Outfits" : "Setting"}
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
          <>
            <ExperienceLanding audience="customer" image={image} Icon={Icon}
              onPrimary={() => { setIntent("builder"); setBuilderMode("bundle"); go("collection") }}
              onSecondary={() => {
                setIntent("builder")
                setBuilderMode("single")
                setSelected((current) => current.slice(0, 1))
                setBundle([])
                go("collection")
              }}
            />
            <section className="home-entry" aria-label="Start your flow">
              <div className="home-entry-heading">
                <Heading level={2}>Start your flow</Heading>
                <p>Pick a category, then choose how you want to shop.</p>
              </div>
              <div className="home-entry-steps">
                <div className="home-step">
                  <span className="home-step-number" aria-hidden="true">1</span>
                  <div>
                    <strong>Choose a clothing category</strong>
                    <div className="shop-categories home-categories" aria-label="Choose a category">
                      {["All", "Top", "Bottom", "Outerwear", "Footwear", "Accessory"].map((c) => (
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
                  </div>
                </div>
                <div className="home-step">
                  <span className="home-step-number" aria-hidden="true">2</span>
                  <div className="home-paths">
                    <button
                      className="home-path-card"
                      onClick={() => { setIntent("purchase"); setBundle([]); setError(""); go("collection") }}
                    >
                      <span className="landing-feature-icon"><Icon name="bag" /></span>
                      <strong>Purchase</strong>
                      <small>Browse {category === "All" ? "the collection" : category} and add pieces straight to your cart.</small>
                      <span className="text-button">Shop to purchase <Icon name="arrow" /></span>
                    </button>
                    <button
                      className="home-path-card"
                      onClick={() => { setIntent("builder"); setBuilderMode("bundle"); go("collection") }}
                    >
                      <span className="landing-feature-icon"><Icon name="layers" /></span>
                      <strong>Check the builder</strong>
                      <small>Fit pieces on a model, get paired recommendations, output a complete look.</small>
                      <span className="text-button">Open outfit builder <Icon name="arrow" /></span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
        {tab === "setting" && (
          <>
            <div className="customer-intro">
              <Heading level={1}>Setting</Heading>
            </div>
            <div className="settings-layout">
              <nav className="settings-nav" aria-label="Setting sections">
                <button
                  className={settingSection === "profile" ? "selected" : ""}
                  aria-current={settingSection === "profile" ? "page" : undefined}
                  onClick={() => setSettingSection("profile")}
                >
                  <strong>Fit profile</strong>
                </button>
                <button
                  className={settingSection === "photos" ? "selected" : ""}
                  aria-current={settingSection === "photos" ? "page" : undefined}
                  onClick={() => setSettingSection("photos")}
                >
                  <strong>Model photos</strong>
                </button>
                <button
                  className={settingSection === "account" ? "selected" : ""}
                  aria-current={settingSection === "account" ? "page" : undefined}
                  onClick={() => setSettingSection("account")}
                >
                  <strong>Account</strong>
                </button>
              </nav>
              <div className="settings-content">
              {settingSection === "profile" && (
              <section className="panel settings-panel" aria-label="Fit profile">
                <div className="panel-header"><div><Heading level={2}>Fit profile</Heading></div></div>
                <div className="settings-body">
                  <p className="shop-demo-note">Defaults applied to your next recommendation. Stored in this browser only.</p>
                  <div className="preference-fields">
                    <label>
                      Size
                      <Select value={prefs.size} onChange={(e) => setPrefs((c) => ({ ...c, size: e.target.value }))}>
                        {catalogueSizes(products).map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </Select>
                    </label>
                    <label>
                      Style
                      <Select value={prefs.style} onChange={(e) => setPrefs((c) => ({ ...c, style: e.target.value }))}>
                        <option>Minimal</option>
                        <option>Tailored</option>
                      </Select>
                    </label>
                    <label>
                      Occasion
                      <Select value={prefs.occasion} onChange={(e) => setPrefs((c) => ({ ...c, occasion: e.target.value }))}>
                        <option>Everyday</option>
                        <option>Work</option>
                        <option>Weekend</option>
                      </Select>
                    </label>
                    <label>
                      Outfit budget (₱)
                      <Input type="number" min="1" max="100000" step="1" required
                        value={prefs.budget || ""}
                        onChange={(e) => setPrefs((c) => ({ ...c, budget: Number(e.target.value) }))} />
                    </label>
                    <label className="full-field">
                      Color preference
                      <Select value={prefs.palette} onChange={(e) => setPrefs((c) => ({ ...c, palette: e.target.value }))}>
                        <option>Any color</option>
                        <option>Light neutrals</option>
                        <option>Dark neutrals</option>
                      </Select>
                    </label>
                  </div>
                  <label className="accessory-choice">
                    <Input type="checkbox" checked={prefs.accessories}
                      onChange={(e) => setPrefs((c) => ({ ...c, accessories: e.target.checked }))} />
                    Include an accessory by default
                  </label>
                </div>
              </section>
              )}
              {settingSection === "photos" && (
              <section className="panel settings-panel" aria-label="Model photos">
                <div className="panel-header"><div><Heading level={2}>Model photos</Heading></div></div>
                <div className="settings-body">
                  <p className="shop-demo-note">Model photos for the fitter. Stored in this browser only.</p>
                  <div className="model-gallery">
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
                        <button onClick={() => setActivePhoto(i)} aria-pressed={activePhoto === i} aria-label={`Use uploaded model ${i + 1}`}>
                          <img src={src} alt={`Uploaded model ${i + 1}`} />
                        </button>
                        <span>Model {i + 1}</span>
                        <Button className="icon-button model-remove" aria-label={`Remove model ${i + 1}`} onClick={() => removePhoto(i)}>
                          <Icon name="close" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              )}
              {settingSection === "account" && (
              <section className="panel settings-panel" aria-label="Account">
                <div className="panel-header"><div><Heading level={2}>Account</Heading></div></div>
                <div className="settings-body account-body">
                  {session ? (
                    <>
                      <p><strong>{session.name}</strong></p>
                      <p className="shop-demo-note">Signed in{session ? ` as ${session.name}` : ""}. Session lives in this browser tab.</p>
                      <Button className="logout-button" onClick={onLogout}>
                        <Icon name="logout" />
                        Log out
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="shop-demo-note">You are browsing as a guest. Cart and checkout need an account.</p>
                      <Button className="button secondary" onClick={onLogin}>Log in</Button>
                    </>
                  )}
                </div>
              </section>
              )}
              </div>
            </div>
          </>
        )}
        {tab === "outfits" && (
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
                      if (mode === "single") setSelected((current) => current.slice(0, 1))
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
                        <Button className="icon-button" aria-label={`Remove outfit ${index + 1}`} onClick={() => setCart((current) => current.filter((b) => b.id !== entry.id))}>
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
        )}
        <Footer note="Recommendations use catalogue rules and known size stock. Photos stay in this browser; AI fitting and retailer checkout are not connected. Inventory freshness depends on the merchant connection." />
      </main>
    </div>
  )
}
