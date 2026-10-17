import { describe, expect, it } from "vitest"
import { recommendOutfitFromPhoto } from "../photoStylist"
import {
  captureFetch,
  inventory,
  outfitResponse,
  photoDataUrl,
  visionConfig,
} from "./fixtures"

describe("recommendOutfitFromPhoto", () => {
  it("returns grounded items for a valid response", async () => {
    const { fetchImpl } = captureFetch(
      outfitResponse({
        top: "TEE-BLK",
        bottom: "PANT-STN",
        footwear: "SNKR-WHT",
      }),
    )
    const result = await recommendOutfitFromPhoto(inventory, photoDataUrl, {
      config: visionConfig,
      preferences: { size: "S" },
      fetchImpl,
    })
    expect(result.items.map((item) => item.sku)).toEqual([
      "TEE-BLK",
      "PANT-STN",
      "SNKR-WHT",
    ])
    expect(result.outfit).toEqual({
      Top: "TEE-BLK",
      Bottom: "PANT-STN",
      Footwear: "SNKR-WHT",
    })
    expect(result.warnings).toEqual([])
    expect(result.analysis).toContain("Person")
  })

  it("attaches the photo as an image_url part and uses the vision model", async () => {
    const { fetchImpl, calls } = captureFetch(
      outfitResponse({ top: "TEE-BLK", bottom: "PANT-STN", footwear: "SNKR-WHT" }),
    )
    await recommendOutfitFromPhoto(inventory, photoDataUrl, {
      config: visionConfig,
      preferences: { size: "S" },
      fetchImpl,
    })
    const body = JSON.parse(String(calls[0].init.body))
    expect(body.model).toBe("test-vision")
    const userMessage = body.messages.find(
      (message: { role: string }) => message.role === "user",
    )
    expect(userMessage.content).toEqual([
      { type: "text", text: expect.any(String) },
      { type: "image_url", image_url: { url: photoDataUrl } },
    ])
  })

  it("rejects hallucinated skus and drops them from the outfit", async () => {
    const { fetchImpl } = captureFetch(
      outfitResponse({
        top: "FAKE-SKU",
        bottom: "PANT-STN",
        footwear: "SNKR-WHT",
      }),
    )
    const result = await recommendOutfitFromPhoto(inventory, photoDataUrl, {
      config: visionConfig,
      preferences: { size: "S" },
      fetchImpl,
    })
    expect(result.items.map((item) => item.sku)).toEqual(["PANT-STN", "SNKR-WHT"])
    expect(result.outfit.Top).toBeUndefined()
    expect(result.rejected).toContainEqual({ sku: "FAKE-SKU", reason: "unknown" })
    expect(result.warnings.join(" ")).toContain("FAKE-SKU")
  })

  it("excludes out-of-stock items and warns about the missing category", async () => {
    const { fetchImpl } = captureFetch(
      outfitResponse({
        top: "SOLD-OUT",
        bottom: "PANT-STN",
        footwear: "SNKR-WHT",
      }),
    )
    const result = await recommendOutfitFromPhoto(inventory, photoDataUrl, {
      config: visionConfig,
      preferences: { size: "S" },
      fetchImpl,
    })
    expect(result.items.map((item) => item.sku)).toEqual(["PANT-STN", "SNKR-WHT"])
    expect(result.rejected).toContainEqual({
      sku: "SOLD-OUT",
      reason: "out-of-stock",
    })
    expect(result.warnings.join(" ")).toContain("Top")
  })

  it("throws a config error when the vision model is missing", async () => {
    const { fetchImpl } = captureFetch(outfitResponse({}))
    await expect(
      recommendOutfitFromPhoto(inventory, photoDataUrl, {
        config: { ...visionConfig, model: "" },
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "config" })
  })

  it("throws invalid-input for a non-image data url", async () => {
    const { fetchImpl } = captureFetch(outfitResponse({}))
    await expect(
      recommendOutfitFromPhoto(inventory, "data:text/plain;base64,AAAA", {
        config: visionConfig,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "invalid-input" })
  })

  it("throws a parse error for malformed JSON", async () => {
    const { fetchImpl } = captureFetch("not json")
    await expect(
      recommendOutfitFromPhoto(inventory, photoDataUrl, {
        config: visionConfig,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "parse" })
  })
})
