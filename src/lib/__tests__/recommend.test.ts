import { describe, expect, it } from "vitest"
import { recommendOutfit } from "../recommend"
import type { Preferences } from "../recommend"
import type { Product } from "../catalogue"
import { inventory } from "./fixtures"

const prefs: Preferences = {
  style: "Minimal",
  occasion: "Everyday",
  palette: "Any color",
  accessories: false,
}

const gown: Product = {
  sku: "GWN-IVY",
  name: "Ivory Evening Gown",
  category: "Dress",
  price: 5990,
  color: "Ivory",
  stock: 4,
  variants: { M: 4 },
}

describe("recommendOutfit with a Dress", () => {
  it("keeps a selected gown in the look and still fills the core categories", () => {
    const result = recommendOutfit([...inventory, gown], gown, prefs)
    expect(result).not.toBeNull()
    expect(result!.map((p) => p.sku)).toContain("GWN-IVY")
    expect(result!.map((p) => p.category)).toEqual(
      expect.arrayContaining(["Dress", "Top", "Bottom", "Footwear"]),
    )
  })

  it("does not treat a gown as a top and bottom replacement", () => {
    const footwear = inventory.find((p) => p.sku === "SNKR-WHT")!
    expect(recommendOutfit([gown, footwear], gown, prefs)).toBeNull()
  })
})
