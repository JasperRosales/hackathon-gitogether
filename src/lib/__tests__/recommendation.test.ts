import { describe, expect, it } from "vitest"
import {
  catalogueContext,
  resolveRecommendations,
  totalStock,
  validateOutfitSelection,
} from "../recommendation"
import { inventory } from "./fixtures"

describe("catalogueContext", () => {
  it("excludes out-of-stock products", () => {
    const { allowedSkus, text } = catalogueContext(inventory)
    expect(allowedSkus).not.toContain("SOLD-OUT")
    expect(text).not.toContain("SOLD-OUT")
  })

  it("filters to products in stock for the requested size", () => {
    const { allowedSkus } = catalogueContext(inventory, { size: "S" })
    expect(allowedSkus).toEqual(["TEE-BLK", "PANT-STN", "SNKR-WHT"])
  })

  it("caps the number of items per category", () => {
    const { allowedSkus } = catalogueContext(inventory, { limitPerCategory: 1 })
    const tops = allowedSkus.filter(
      (sku) => inventory.find((p) => p.sku === sku)?.category === "Top",
    )
    expect(tops).toHaveLength(1)
  })

  it("restricts to requested categories", () => {
    const { allowedSkus } = catalogueContext(inventory, {
      categories: ["Footwear"],
    })
    expect(allowedSkus).toEqual(["SNKR-WHT"])
  })
})

describe("resolveRecommendations", () => {
  it("resolves a known in-stock sku at the requested size", () => {
    const { items, rejected } = resolveRecommendations(inventory, ["TEE-BLK"], {
      size: "S",
    })
    expect(rejected).toEqual([])
    expect(items).toEqual([
      {
        sku: "TEE-BLK",
        name: "Diagonal Tee Black",
        category: "Top",
        price: 1000,
        color: "Black",
        imageUrl: "https://example.com/tee-black.jpg",
        size: "S",
        stock: 5,
      },
    ])
  })

  it("rejects unknown, out-of-stock and size-unavailable skus", () => {
    const { items, rejected } = resolveRecommendations(
      inventory,
      ["UNKNOWN", "SOLD-OUT", "PANT-L", "TEE-BLK"],
      { size: "S" },
    )
    expect(items.map((item) => item.sku)).toEqual(["TEE-BLK"])
    expect(rejected).toEqual([
      { sku: "UNKNOWN", reason: "unknown" },
      { sku: "SOLD-OUT", reason: "out-of-stock" },
      { sku: "PANT-L", reason: "size-unavailable" },
    ])
  })

  it("deduplicates repeated skus", () => {
    const { items } = resolveRecommendations(inventory, ["TEE-BLK", "TEE-BLK"])
    expect(items).toHaveLength(1)
  })

  it("picks the size with the most stock when no size is given", () => {
    const { items } = resolveRecommendations(inventory, ["TEE-BLK"])
    expect(items[0].size).toBe("M")
    expect(items[0].stock).toBe(10)
  })

  it("sources price from inventory, not the caller", () => {
    const { items } = resolveRecommendations(inventory, ["PANT-STN"], {
      size: "S",
    })
    expect(items[0].price).toBe(2490)
  })
})

describe("validateOutfitSelection", () => {
  it("is valid when top, bottom and footwear resolve", () => {
    const result = validateOutfitSelection(
      inventory,
      { Top: "TEE-BLK", Bottom: "PANT-STN", Footwear: "SNKR-WHT" },
      { size: "S" },
    )
    expect(result.valid).toBe(true)
    expect(result.missing).toEqual([])
  })

  it("reports missing core categories", () => {
    const result = validateOutfitSelection(
      inventory,
      { Top: "TEE-BLK", Bottom: "PANT-STN" },
      { size: "S" },
    )
    expect(result.valid).toBe(false)
    expect(result.missing).toEqual(["Footwear"])
  })

  it("reports a category whose sku is unavailable", () => {
    const result = validateOutfitSelection(
      inventory,
      { Top: "TEE-BLK", Bottom: "PANT-STN", Footwear: "SOLD-OUT" },
      { size: "S" },
    )
    expect(result.missing).toEqual(["Footwear"])
    expect(result.rejected).toContainEqual({
      sku: "SOLD-OUT",
      reason: "out-of-stock",
    })
  })
})

describe("totalStock", () => {
  it("sums variant stock", () => {
    expect(totalStock(inventory[0])).toBe(15)
    expect(totalStock(inventory[4])).toBe(0)
  })
})
