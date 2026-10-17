import type { Product } from "@/lib/catalogue"

export type ShopTab = "home" | "outfits"

export type ShopView = "collection" | "fitting" | "cart" | "product"

export type CartBundle = {
  id: string
  items: Product[]
  style: string
  occasion: string
  quantities: Record<string, number>
  selectedSkus: string[]
}
