import type { Product } from "@/lib/catalogue"

export type ShopTab = "home" | "outfits"

export type ShopView = "collection" | "outfit" | "fitting" | "cart" | "product"

export type ShopIntent = "purchase" | "builder"

export type BuilderMode = "single" | "bundle"

export type CartBundle = {
  id: string
  items: Product[]
  size: string
  style: string
  occasion: string
  quantities: Record<string, number>
  selectedSkus: string[]
}
