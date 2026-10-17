import { describe, expect, it } from "vitest"
import { chat, parseJsonContent } from "../aiClient"
import { RecommendationError } from "../recommendation"
import { apiResponse, captureFetch, contentResponse } from "./fixtures"

const config = { apiKey: "test-key", baseUrl: "https://api.test/v1" }

describe("chat", () => {
  it("posts an authorized JSON request and returns the content", async () => {
    const { fetchImpl, calls } = captureFetch("hello")
    const result = await chat({
      model: "test-text",
      messages: [{ role: "user", content: "hi" }],
      json: true,
      config,
      fetchImpl,
    })
    expect(result).toBe("hello")
    expect(calls[0].url).toBe("https://api.test/v1/chat/completions")
    const headers = calls[0].init.headers as Record<string, string>
    expect(headers.Authorization).toBe("Bearer test-key")
    const body = JSON.parse(String(calls[0].init.body))
    expect(body.model).toBe("test-text")
    expect(body.response_format).toEqual({ type: "json_object" })
  })

  it("omits response_format when json is not requested", async () => {
    const { fetchImpl, calls } = captureFetch("plain")
    await chat({
      model: "m",
      messages: [{ role: "user", content: "hi" }],
      config,
      fetchImpl,
    })
    const body = JSON.parse(String(calls[0].init.body))
    expect(body.response_format).toBeUndefined()
  })

  it("throws a config error when the endpoint is not configured", async () => {
    await expect(
      chat({
        model: "m",
        messages: [],
        config: { apiKey: "", baseUrl: "" },
        fetchImpl: (async () => contentResponse("x")) as typeof fetch,
      }),
    ).rejects.toMatchObject({ code: "config" })
  })

  it("maps a non-2xx response to an http error", async () => {
    const fetchImpl = (async () =>
      apiResponse(
        { error: { message: "bad model" } },
        { ok: false, status: 400 },
      )) as typeof fetch
    await expect(
      chat({ model: "m", messages: [], config, fetchImpl }),
    ).rejects.toMatchObject({ code: "http", message: "bad model" })
  })

  it("maps an empty completion to a parse error", async () => {
    const { fetchImpl } = captureFetch("")
    await expect(
      chat({ model: "m", messages: [], config, fetchImpl }),
    ).rejects.toMatchObject({ code: "parse" })
  })

  it("maps a network failure to a network error", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("Failed to fetch")
    }) as typeof fetch
    await expect(
      chat({ model: "m", messages: [], config, fetchImpl }),
    ).rejects.toMatchObject({ code: "network" })
  })

  it("aborts and reports a timeout", async () => {
    const hanging = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        )
      })
    }) as typeof fetch
    await expect(
      chat({ model: "m", messages: [], timeoutMs: 5, config, fetchImpl: hanging }),
    ).rejects.toMatchObject({ code: "timeout" })
  })

  it("throws RecommendationError instances", async () => {
    const { fetchImpl } = captureFetch("")
    await expect(
      chat({ model: "m", messages: [], config, fetchImpl }),
    ).rejects.toBeInstanceOf(RecommendationError)
  })
})

describe("parseJsonContent", () => {
  it("parses plain JSON", () => {
    expect(parseJsonContent('{"a":1}')).toEqual({ a: 1 })
  })

  it("strips markdown code fences", () => {
    expect(parseJsonContent('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it("throws a parse error for invalid JSON", () => {
    expect(() => parseJsonContent("not json")).toThrowError(RecommendationError)
  })
})
