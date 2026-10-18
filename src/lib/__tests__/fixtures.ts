import type { Product } from "../catalogue"
import type { AiProviderConfig } from "../aiConfig"

export const inventory: Product[] = [
  {
    sku: "TEE-BLK",
    name: "Diagonal Tee Black",
    category: "Top",
    price: 1000,
    color: "Black",
    stock: 15,
    variants: { S: 5, M: 10 },
    imageUrl: "https://example.com/tee-black.jpg",
  },
  {
    sku: "TEE-SKY",
    name: "Cursive Tee Sky",
    category: "Top",
    price: 1000,
    color: "Sky Blue",
    stock: 8,
    variants: { M: 8 },
    imageUrl: "https://example.com/tee-sky.jpg",
  },
  {
    sku: "PANT-STN",
    name: "Tailored Trousers",
    category: "Bottom",
    price: 2490,
    color: "Stone",
    stock: 4,
    variants: { S: 4 },
    imageUrl: "https://example.com/pant.jpg",
  },
  {
    sku: "SNKR-WHT",
    name: "Canvas Sneakers",
    category: "Footwear",
    price: 2290,
    color: "White",
    stock: 6,
    variants: { S: 6 },
    imageUrl: "https://example.com/sneaker.jpg",
  },
  {
    sku: "SOLD-OUT",
    name: "Sold Out Shirt",
    category: "Top",
    price: 900,
    color: "White",
    stock: 0,
    variants: { S: 0, M: 0 },
  },
  {
    sku: "PANT-L",
    name: "Only Large Trouser",
    category: "Bottom",
    price: 1500,
    color: "Black",
    stock: 3,
    variants: { L: 3 },
  },
]

export const visionConfig: AiProviderConfig = {
  apiKey: "test-key",
  baseUrl: "https://api.test/v1",
  model: "test-vision",
}

export const conversationConfig: AiProviderConfig = {
  apiKey: "gemini-key",
  baseUrl: "https://gemini.test/v1beta/openai",
  model: "gemini-2.5-flash",
}

export const photoDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="

export function apiResponse(
  payload: unknown,
  init: { ok?: boolean; status?: number; headers?: Record<string, string> } = {},
): Response {
  const headers = init.headers ?? {}
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => payload,
  } as unknown as Response
}

export function contentResponse(
  content: string,
  init: { ok?: boolean; status?: number; headers?: Record<string, string> } = {},
): Response {
  return apiResponse({ choices: [{ message: { content } }] }, init)
}

export function captureFetch(content: string): {
  fetchImpl: typeof fetch
  calls: { url: string; init: RequestInit }[]
} {
  const calls: { url: string; init: RequestInit }[] = []
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} })
    return contentResponse(content)
  }) as typeof fetch
  return { fetchImpl, calls }
}

export function outfitResponse(
  outfit: Record<string, string>,
  extra: Record<string, unknown> = {},
): string {
  return JSON.stringify({
    analysis: "Person wearing neutral layers.",
    reasoning: "Neutral tones suit the request.",
    outfit,
    ...extra,
  })
}
