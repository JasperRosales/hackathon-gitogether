import { productColor, productTotal } from "./catalogue"
import type { Product } from "./catalogue"

export type Preferences = {
  style: string
  occasion: string
  palette: string
  accessories: boolean
}

export function compatible(product: Product, prefs: Preferences) {
  const dark = /black|navy|charcoal|espresso|dark|brown/i.test(
    productColor(product),
  )
  const light = /white|cream|sand|stone|beige|ivory|light|gr[ae]y/i.test(
    productColor(product),
  )
  return (
    product.stock > 0 &&
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
    selectedPieces.some((p) => !compatible(p, prefs)) ||
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
  // A selected one-piece garment stays in the look; core slots stay required.
  if (selectedPieces.some((p) => p.category === "Dress"))
    categories.push("Dress")
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
    candidates.sort(
      (a, b) => score(b) - score(a) || productTotal(a) - productTotal(b),
    )[0] || null
  )
}
