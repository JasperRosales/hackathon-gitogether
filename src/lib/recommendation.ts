import type { Product } from "./catalogue"
import { productSizes, variantStock } from "./catalogue"

export type RecommendationErrorCode =
  | "config"
  | "invalid-input"
  | "timeout"
  | "network"
  | "http"
  | "parse"

export class RecommendationError extends Error {
  readonly code: RecommendationErrorCode
  constructor(code: RecommendationErrorCode, message: string) {
    super(message)
    this.name = "RecommendationError"
    this.code = code
  }
}

export type StylistPreferences = {
  size?: string
  occasion?: string
  style?: string
  palette?: string
  budget?: number
}

export type RecommendedItem = {
  sku: string
  name: string
  category: string
  price: number
  color?: string
  imageUrl?: string
  size: string
  stock: number
}

export type RejectionReason = "unknown" | "out-of-stock" | "size-unavailable"

export type RejectedSku = { sku: string; reason: RejectionReason }

export type ResolveResult = { items: RecommendedItem[]; rejected: RejectedSku[] }

export const CORE_CATEGORIES = ["Top", "Bottom", "Footwear"] as const

export const DEFAULT_LIMIT_PER_CATEGORY = 40

export function totalStock(product: Product): number {
  return productSizes(product).reduce(
    (sum, size) => sum + variantStock(product, size),
    0,
  )
}

export function availableSizes(product: Product): string[] {
  return productSizes(product).filter((size) => variantStock(product, size) > 0)
}

export function rejectMessage(rejected: RejectedSku): string {
  switch (rejected.reason) {
    case "unknown":
      return `Ignored ${rejected.sku}: not in the catalogue.`
    case "out-of-stock":
      return `Ignored ${rejected.sku}: out of stock.`
    case "size-unavailable":
      return `Ignored ${rejected.sku}: unavailable in the requested size.`
    default:
      return `Ignored ${rejected.sku}.`
  }
}

export type CatalogueContextOptions = {
  size?: string
  categories?: string[]
  limitPerCategory?: number
}

export function catalogueContext(
  products: Product[],
  options: CatalogueContextOptions = {},
): { text: string; allowedSkus: string[] } {
  const limit = options.limitPerCategory ?? DEFAULT_LIMIT_PER_CATEGORY
  const categoryFilter =
    options.categories && options.categories.length
      ? new Set(options.categories)
      : null
  const usedPerCategory = new Map<string, number>()
  const allowedSkus: string[] = []
  const lines: string[] = []
  for (const product of products) {
    if (categoryFilter && !categoryFilter.has(product.category)) continue
    const sizes = availableSizes(product)
    if (!sizes.length) continue
    if (options.size && variantStock(product, options.size) <= 0) continue
    const used = usedPerCategory.get(product.category) ?? 0
    if (used >= limit) continue
    usedPerCategory.set(product.category, used + 1)
    allowedSkus.push(product.sku)
    const sizeStock: Record<string, number> = {}
    for (const size of sizes) sizeStock[size] = variantStock(product, size)
    lines.push(
      JSON.stringify({
        sku: product.sku,
        name: product.name,
        category: product.category,
        color: product.color,
        price: product.price,
        sizes: sizeStock,
      }),
    )
  }
  return { text: lines.join("\n"), allowedSkus }
}

export function resolveRecommendations(
  products: Product[],
  skus: string[],
  options: { size?: string } = {},
): ResolveResult {
  const bySku = new Map(products.map((product) => [product.sku, product]))
  const items: RecommendedItem[] = []
  const rejected: RejectedSku[] = []
  const seen = new Set<string>()
  for (const value of skus) {
    const sku = typeof value === "string" ? value.trim() : ""
    if (!sku || seen.has(sku)) continue
    seen.add(sku)
    const product = bySku.get(sku)
    if (!product) {
      rejected.push({ sku, reason: "unknown" })
      continue
    }
    if (totalStock(product) <= 0) {
      rejected.push({ sku, reason: "out-of-stock" })
      continue
    }
    let size: string
    if (options.size) {
      if (variantStock(product, options.size) <= 0) {
        rejected.push({ sku, reason: "size-unavailable" })
        continue
      }
      size = options.size
    } else {
      const sizes = availableSizes(product).sort(
        (a, b) => variantStock(product, b) - variantStock(product, a),
      )
      size = sizes[0]
      if (!size) {
        rejected.push({ sku, reason: "out-of-stock" })
        continue
      }
    }
    items.push({
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price,
      color: product.color,
      imageUrl: product.imageUrl,
      size,
      stock: variantStock(product, size),
    })
  }
  return { items, rejected }
}

export function validateOutfitSelection(
  products: Product[],
  byCategory: Partial<Record<string, string>>,
  options: { size?: string } = {},
): { valid: boolean; missing: string[]; rejected: RejectedSku[] } {
  const missing: string[] = []
  const rejected: RejectedSku[] = []
  for (const category of CORE_CATEGORIES) {
    const sku = byCategory[category]
    if (!sku) {
      missing.push(category)
      continue
    }
    const result = resolveRecommendations(products, [sku], options)
    if (!result.items.length) {
      missing.push(category)
      rejected.push(...result.rejected)
    }
  }
  return { valid: missing.length === 0, missing, rejected }
}
