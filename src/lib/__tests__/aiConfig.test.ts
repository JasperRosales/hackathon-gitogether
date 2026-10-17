import { describe, expect, it } from "vitest"
import {
  assertConversationConfigured,
  assertVisionConfigured,
  isConversationConfigured,
  isVisionConfigured,
  readConversationConfig,
  readVisionConfig,
} from "../aiConfig"
import { RecommendationError } from "../recommendation"

const env = (values: Record<string, string>): ImportMetaEnv =>
  values as unknown as ImportMetaEnv

describe("readVisionConfig", () => {
  it("reads, trims and strips trailing slashes from AMD values", () => {
    const config = readVisionConfig(
      env({
        VITE_AMD_CLOUD_API_KEY: " key ",
        VITE_AMD_CLOUD_BASE_URL: "https://api.test/v1/",
        VITE_AMD_CLOUD_VISION_MODEL: " vlm ",
      }),
    )
    expect(config).toEqual({
      apiKey: "key",
      baseUrl: "https://api.test/v1",
      model: "vlm",
    })
  })
})

describe("readConversationConfig", () => {
  it("defaults to the Gemini endpoint and model", () => {
    const config = readConversationConfig(env({ VITE_GEMINI_API_KEY: "g" }))
    expect(config).toEqual({
      apiKey: "g",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      model: "gemini-2.5-flash",
    })
  })

  it("honours overrides and strips trailing slashes", () => {
    const config = readConversationConfig(
      env({
        VITE_GEMINI_API_KEY: "g",
        VITE_GEMINI_BASE_URL: "https://x/v1beta/openai/",
        VITE_GEMINI_MODEL: "gemini-2.0-flash",
      }),
    )
    expect(config).toEqual({
      apiKey: "g",
      baseUrl: "https://x/v1beta/openai",
      model: "gemini-2.0-flash",
    })
  })
})

describe("configuration checks", () => {
  it("isVisionConfigured requires key, URL and model", () => {
    expect(isVisionConfigured(env({}))).toBe(false)
    expect(
      isVisionConfigured(env({ VITE_AMD_CLOUD_API_KEY: "k" })),
    ).toBe(false)
    expect(
      isVisionConfigured(
        env({
          VITE_AMD_CLOUD_API_KEY: "k",
          VITE_AMD_CLOUD_BASE_URL: "https://api.test/v1",
          VITE_AMD_CLOUD_VISION_MODEL: "vlm",
        }),
      ),
    ).toBe(true)
  })

  it("isConversationConfigured only needs a Gemini key", () => {
    expect(isConversationConfigured(env({}))).toBe(false)
    expect(
      isConversationConfigured(env({ VITE_GEMINI_API_KEY: "g" })),
    ).toBe(true)
  })
})

describe("assert helpers", () => {
  it("throws a config error when the vision model is missing", () => {
    expect(() =>
      assertVisionConfigured({
        apiKey: "key",
        baseUrl: "https://api.test/v1",
        model: "",
      }),
    ).toThrowError(RecommendationError)
  })

  it("throws a config error when the Gemini key is missing", () => {
    expect(() =>
      assertConversationConfigured({
        apiKey: "",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        model: "gemini-2.5-flash",
      }),
    ).toThrowError(RecommendationError)
  })

  it("passes for fully configured providers", () => {
    expect(() =>
      assertVisionConfigured({
        apiKey: "key",
        baseUrl: "https://api.test/v1",
        model: "vlm",
      }),
    ).not.toThrow()
    expect(() =>
      assertConversationConfigured({
        apiKey: "g",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        model: "gemini-2.5-flash",
      }),
    ).not.toThrow()
  })
})
