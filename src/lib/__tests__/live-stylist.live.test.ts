import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  isConversationConfigured,
  isVisionConfigured,
  readConversationConfig,
  readVisionConfig,
} from "../aiConfig"
import { recommendFromConversation } from "../conversationalStylist"
import { recommendOutfitFromPhoto } from "../photoStylist"
import { inventory } from "./fixtures"

const conversation = readConversationConfig(import.meta.env)
const vision = readVisionConfig(import.meta.env)
// Node has no Vite proxy, so expand the relative proxy path to the real host.
if (vision.baseUrl.startsWith("/")) {
  vision.baseUrl = `https://developer.amd.com.cn/radeon${vision.baseUrl.replace(/^\/amd-cloud/, "")}`
}

const photoDataUrl = `data:image/jpeg;base64,${readFileSync(
  new URL("../../assets/model1.jpg", import.meta.url),
).toString("base64")}`

describe("live AI smoke test", () => {
  it.runIf(isConversationConfigured(import.meta.env))(
    "conversational stylist (Gemini) returns a grounded reply",
    async () => {
      const result = await recommendFromConversation(
        inventory,
        [{ role: "user", content: "reco some clean fits for a birthday" }],
        { config: conversation, preferences: { size: "M" } },
      )
      console.log("conversational:", JSON.stringify(result, null, 2))
      expect(result.message.length).toBeGreaterThan(0)
      for (const item of result.items) {
        expect(inventory.some((product) => product.sku === item.sku)).toBe(true)
      }
    },
    60000,
  )

  it.runIf(isVisionConfigured(import.meta.env))(
    "photo stylist (AMD vision) returns a grounded outfit",
    async () => {
      const result = await recommendOutfitFromPhoto(inventory, photoDataUrl, {
        config: vision,
        preferences: { size: "M" },
        timeoutMs: 150000,
      })
      console.log("photo:", JSON.stringify(result, null, 2))
      expect(result.analysis.length).toBeGreaterThan(0)
      for (const item of result.items) {
        expect(inventory.some((product) => product.sku === item.sku)).toBe(true)
      }
    },
    180000,
  )
})
