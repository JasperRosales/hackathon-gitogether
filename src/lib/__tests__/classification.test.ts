import { describe, expect, it } from "vitest"
import {
  categoryList,
  classificationCategories,
  isClassificationCategory,
  normalizeCategory,
} from "../classification"
import { parseCatalogueCsv } from "../catalogue"

describe("classification categories", () => {
  it("includes Dress alongside the original categories", () => {
    expect(classificationCategories).toEqual([
      "Top",
      "Bottom",
      "Dress",
      "Outerwear",
      "Footwear",
      "Accessory",
    ])
    expect(isClassificationCategory("Dress")).toBe(true)
    expect(isClassificationCategory("Gown")).toBe(false)
    expect(categoryList()).toContain("Dress")
  })
})

describe("normalizeCategory", () => {
  it("matches the canonical categories in any casing", () => {
    expect(normalizeCategory("top")).toBe("Top")
    expect(normalizeCategory("DRESS")).toBe("Dress")
    expect(normalizeCategory("  Footwear ")).toBe("Footwear")
  })

  it("maps gowns and one-piece garments to Dress", () => {
    const labels = [
      "Gown",
      "Evening Gown",
      "Ball Gown",
      "Wedding Gown",
      "Nightgown",
      "Cocktail Dress",
      "Sundress",
      "Jumpsuit",
      "Romper",
      "Overalls",
      "Sari",
      "Kaftan",
      "Playsuit",
    ]
    for (const label of labels) expect(normalizeCategory(label)).toBe("Dress")
  })

  it("maps bags and small goods to Accessory", () => {
    const labels = [
      "Bag",
      "Handbag",
      "Tote Bag",
      "Purse",
      "Backpack",
      "Crossbody Bag",
      "Handbags",
      "Belt",
      "Beanie",
      "Scarf",
      "Sunglasses",
      "Socks",
      "Gold Necklace",
      "Wrist Watch",
    ]
    for (const label of labels) expect(normalizeCategory(label)).toBe("Accessory")
  })

  it("maps garment terms to their own categories", () => {
    expect(normalizeCategory("Hoodie")).toBe("Top")
    expect(normalizeCategory("Blouses")).toBe("Top")
    expect(normalizeCategory("Chinos")).toBe("Bottom")
    expect(normalizeCategory("Mini Skirt")).toBe("Bottom")
    expect(normalizeCategory("Blazer")).toBe("Outerwear")
    expect(normalizeCategory("Raincoat")).toBe("Outerwear")
    expect(normalizeCategory("Sneakers")).toBe("Footwear")
    expect(normalizeCategory("Loafers")).toBe("Footwear")
  })

  it("prefers the more specific phrase over a shared word", () => {
    expect(normalizeCategory("Dress Shirt")).toBe("Top")
    expect(normalizeCategory("Dressing Gown")).toBe("Outerwear")
    expect(normalizeCategory("Wrap Dress")).toBe("Dress")
  })

  it("recovers from labels that mix a category word with product detail", () => {
    expect(normalizeCategory("Silk Blouse")).toBe("Top")
    expect(normalizeCategory("Denim Jacket")).toBe("Outerwear")
    expect(normalizeCategory("Floral Maxi Dress")).toBe("Dress")
  })

  it("returns null for values it cannot place", () => {
    expect(normalizeCategory("Kitchen Sink")).toBeNull()
    expect(normalizeCategory("")).toBeNull()
    expect(normalizeCategory(42)).toBeNull()
  })
})

describe("parseCatalogueCsv categories", () => {
  const header = "sku,name,category,price,image_url,size,stock,color"

  it("accepts aliases such as ball gown and handbag", () => {
    const csv = [
      header,
      "GW-01,Ivory Evening Gown,ball gown,5990.00,https://example.com/gown.jpg,M,4,Ivory",
      "BG-01,Leather Tote,handbag,2990.00,https://example.com/bag.jpg,M,6,Tan",
      "HD-01,Wool Beanie,beanie,490.00,https://example.com/hat.jpg,M,9,Charcoal",
    ].join("\n")
    const result = parseCatalogueCsv(csv)
    expect(result.errors).toEqual([])
    expect(result.products.map((p) => p.category)).toEqual([
      "Dress",
      "Accessory",
      "Accessory",
    ])
  })

  it("explains the accepted categories when the value is unknown", () => {
    const csv = [
      header,
      "XX-01,Mystery Item,kitchen sink,100.00,https://example.com/x.jpg,M,1,Black",
    ].join("\n")
    const result = parseCatalogueCsv(csv)
    expect(result.errors.join(" ")).toContain(
      `category must be one of: ${categoryList()}`,
    )
    expect(result.products).toEqual([])
  })
})
