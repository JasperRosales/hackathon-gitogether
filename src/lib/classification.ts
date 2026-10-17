import type { Product } from "./catalogue"

export const classificationCategories = [
  "Top",
  "Bottom",
  "Outerwear",
  "Footwear",
  "Accessory",
] as const

export type ClassificationCategory = typeof classificationCategories[number]

export type ClassificationConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

export type ClassifiedProduct = {
  sku: string
  category: ClassificationCategory
  confidence?: number
  reason?: string
}

export type ClassificationOutcome = {
  results: ClassifiedProduct[]
  errors: string[]
}

const DEFAULT_MODEL = "DeepSeek-V4-Flash-Vision-Exp"
const DEFAULT_BASE_URL = "/amd-cloud/v1"
const TEXT_TIMEOUT_MS = 120000
const IMAGE_TIMEOUT_MS = 120000
const BATCH_SIZE = 10

export function categoryList(): string {
  return classificationCategories.join(", ")
}

export function isClassificationCategory(
  value: unknown,
): value is ClassificationCategory {
  return (
    typeof value === "string" &&
    (classificationCategories as readonly string[]).includes(value)
  )
}

export function normalizeCategory(
  value: unknown,
): ClassificationCategory | null {
  if (typeof value !== "string") return null
  const cleaned = value.trim().toLowerCase()
  const match = classificationCategories.find(
    (category) => category.toLowerCase() === cleaned,
  )
  if (match) return match
  const aliases: Record<string, ClassificationCategory> = {
    tops: "Top",
    shirt: "Top",
    shirts: "Top",
    bottom: "Bottom",
    bottoms: "Bottom",
    pants: "Bottom",
    trousers: "Bottom",
    jacket: "Outerwear",
    jackets: "Outerwear",
    coat: "Outerwear",
    coats: "Outerwear",
    shoes: "Footwear",
    shoe: "Footwear",
    sneakers: "Footwear",
    boots: "Footwear",
    accessories: "Accessory",
    accessories_: "Accessory",
    bag: "Accessory",
    bags: "Accessory",
  }
  return aliases[cleaned] ?? null
}

export function readClassificationConfig(
  env: ImportMetaEnv = import.meta.env,
): ClassificationConfig {
  return {
    apiKey: (env.VITE_AMD_CLOUD_API_KEY || "").trim(),
    baseUrl: (env.VITE_AMD_CLOUD_BASE_URL || DEFAULT_BASE_URL)
      .trim()
      .replace(/\/+$/, ""),
    model: (env.VITE_AMD_CLOUD_MODEL || "").trim() || DEFAULT_MODEL,
  }
}

export function isClassificationConfigured(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  const { apiKey, baseUrl } = readClassificationConfig(env)
  return Boolean(apiKey && baseUrl)
}

function assertConfig(config: ClassificationConfig) {
  if (!config.baseUrl)
    throw new Error(
      "AMD Cloud base URL is missing. Set VITE_AMD_CLOUD_BASE_URL to the OpenAI-compatible endpoint.",
    )
  if (!config.apiKey)
    throw new Error(
      "AMD Cloud API key is missing. Set VITE_AMD_CLOUD_API_KEY before classifying.",
    )
}

const systemPrompt = `You are a fashion catalogue classifier.
Assign every product to exactly one category from this list: ${categoryList()}.
Use the product name, color, price and any existing category hint.
Respond with JSON only, in the shape {"items":[{"sku":"...","category":"...","confidence":0.0,"reason":"..."}]}.
"sku" must echo the input sku. "category" must be one of the listed categories exactly.
"confidence" is a number between 0 and 1. "reason" is a short phrase.`

function buildRequestBody(
  config: ClassificationConfig,
  products: Product[],
): string {
  return JSON.stringify({
    model: config.model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          items: products.map((product) => ({
            sku: product.sku,
            name: product.name,
            color: product.color,
            price: product.price,
            currentCategory: product.category,
          })),
        }),
      },
    ],
  })
}

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[]
  error?: { message?: string }
}

function parseItems(content: string): unknown[] {
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return []
  }
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>
    for (const key of ["items", "products", "results", "data"]) {
      if (Array.isArray(record[key])) return record[key] as unknown[]
    }
  }
  return []
}

async function callModel(
  config: ClassificationConfig,
  products: Product[],
  signal?: AbortSignal,
): Promise<ClassifiedProduct[]> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(() => controller.abort(), TEXT_TIMEOUT_MS)
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: buildRequestBody(config, products),
      signal: controller.signal,
    })
    const payload = (await response
      .json()
      .catch(() => null)) as ChatCompletionResponse | null
    if (!response.ok)
      throw new Error(
        payload?.error?.message ||
          `AMD Cloud returned HTTP ${response.status}.`,
      )
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error("AMD Cloud returned an empty completion.")
    const bySku = new Map(products.map((product) => [product.sku, product]))
    const results: ClassifiedProduct[] = []
    for (const item of parseItems(content)) {
      if (!item || typeof item !== "object") continue
      const record = item as Record<string, unknown>
      const category = normalizeCategory(record.category)
      const sku = typeof record.sku === "string" ? record.sku : ""
      if (!category || !bySku.has(sku)) continue
      const confidence =
        typeof record.confidence === "number" &&
        record.confidence >= 0 &&
        record.confidence <= 1
          ? record.confidence
          : undefined
      results.push({
        sku,
        category,
        confidence,
        reason: typeof record.reason === "string" ? record.reason : undefined,
      })
    }
    if (!results.length)
      throw new Error("AMD Cloud response did not contain valid categories.")
    return results
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        signal?.aborted
          ? "Classification cancelled."
          : `AMD Cloud request timed out after ${TEXT_TIMEOUT_MS / 1000} seconds.`,
      )
    if (error instanceof TypeError)
      throw new Error(
        "Cannot reach AMD Cloud. Check VITE_AMD_CLOUD_BASE_URL and that the endpoint allows browser requests (CORS).",
      )
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener("abort", abort)
  }
}

export async function classifyProduct(
  product: Product,
  options: {
    config?: ClassificationConfig
    signal?: AbortSignal
  } = {},
): Promise<ClassifiedProduct | null> {
  const config = options.config ?? readClassificationConfig()
  assertConfig(config)
  const [result] = await callModel(config, [product], options.signal)
  return result ?? null
}

export async function classifyProducts(
  products: Product[],
  options: {
    config?: ClassificationConfig
    signal?: AbortSignal
    onProgress?: (processed: number, total: number) => void
  } = {},
): Promise<ClassificationOutcome> {
  const config = options.config ?? readClassificationConfig()
  assertConfig(config)
  const results: ClassifiedProduct[] = []
  const errors: string[] = []
  for (let index = 0; index < products.length; index += BATCH_SIZE) {
    if (options.signal?.aborted) {
      errors.push("Classification cancelled.")
      break
    }
    const batch = products.slice(index, index + BATCH_SIZE)
    try {
      const batchResults = await callModel(config, batch, options.signal)
      results.push(...batchResults)
    } catch (error) {
      errors.push(
        `Batch ${Math.floor(index / BATCH_SIZE) + 1}: ${
          error instanceof Error ? error.message : "Classification failed."
        }`,
      )
    }
    options.onProgress?.(
      Math.min(index + BATCH_SIZE, products.length),
      products.length,
    )
  }
  return { results, errors }
}

export function applyClassifications(
  products: Product[],
  outcomes: ClassifiedProduct[],
): Product[] {
  const bySku = new Map(outcomes.map((outcome) => [outcome.sku, outcome]))
  return products.map((product) => {
    const outcome = bySku.get(product.sku)
    if (!outcome || outcome.category === product.category) return product
    return { ...product, category: outcome.category }
  })
}

export type ImageClassification = {
  name: string
  category: ClassificationCategory
  color?: string
  confidence?: number
  reason?: string
}

export type ClassifiedImage = ImageClassification & { id: string }

export type ImageClassificationOutcome = {
  results: ClassifiedImage[]
  errors: string[]
}

const IMAGE_CONCURRENCY = 2

const imageSystemPrompt = `You are a fashion product identifier for a clothing catalogue.
Look at the single garment or accessory in the photo.
Return JSON only, in the shape {"name":"...","category":"...","color":"...","confidence":0.0,"reason":"..."}.
"name" is a short catalogue title (2-6 words) in title case.
"category" must be exactly one of: ${categoryList()}.
"color" is the dominant colour. "confidence" is 0-1. "reason" is a short phrase.`

function parseImageResult(content: string): ImageClassification | null {
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }
  const record = Array.isArray(parsed)
    ? (parsed[0] as unknown)
    : parsed
  if (!record || typeof record !== "object") return null
  const fields = record as Record<string, unknown>
  const category = normalizeCategory(fields.category)
  const name =
    typeof fields.name === "string" ? fields.name.trim().slice(0, 200) : ""
  if (!category || !name) return null
  return {
    name,
    category,
    color:
      typeof fields.color === "string"
        ? fields.color.trim().slice(0, 80)
        : undefined,
    confidence:
      typeof fields.confidence === "number" &&
      fields.confidence >= 0 &&
      fields.confidence <= 1
        ? fields.confidence
        : undefined,
    reason: typeof fields.reason === "string" ? fields.reason : undefined,
  }
}

async function callModelForImage(
  config: ClassificationConfig,
  dataUrl: string,
  signal?: AbortSignal,
): Promise<ImageClassification> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS)
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: imageSystemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify the garment in this photo." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    })
    const payload = (await response
      .json()
      .catch(() => null)) as ChatCompletionResponse | null
    if (!response.ok)
      throw new Error(
        payload?.error?.message ||
          `AMD Cloud returned HTTP ${response.status}.`,
      )
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error("AMD Cloud returned an empty completion.")
    const result = parseImageResult(content)
    if (!result) throw new Error("AMD Cloud could not identify this image.")
    return result
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        signal?.aborted
          ? "Classification cancelled."
          : `AMD Cloud request timed out after ${IMAGE_TIMEOUT_MS / 1000} seconds.`,
      )
    if (error instanceof TypeError)
      throw new Error(
        "Cannot reach AMD Cloud. Check the endpoint and that the proxy is running.",
      )
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener("abort", abort)
  }
}

export async function classifyImage(
  dataUrl: string,
  options: { config?: ClassificationConfig; signal?: AbortSignal } = {},
): Promise<ImageClassification> {
  const config = options.config ?? readClassificationConfig()
  assertConfig(config)
  return callModelForImage(config, dataUrl, options.signal)
}

export async function classifyImages(
  images: { id: string; dataUrl: string }[],
  options: {
    config?: ClassificationConfig
    signal?: AbortSignal
    onProgress?: (processed: number, total: number) => void
  } = {},
): Promise<ImageClassificationOutcome> {
  const config = options.config ?? readClassificationConfig()
  assertConfig(config)
  const results: ClassifiedImage[] = []
  const errors: string[] = []
  let processed = 0
  let cursor = 0
  const worker = async () => {
    while (cursor < images.length) {
      if (options.signal?.aborted) return
      const image = images[cursor++]
      try {
        const result = await callModelForImage(
          config,
          image.dataUrl,
          options.signal,
        )
        results.push({ id: image.id, ...result })
      } catch (error) {
        if (options.signal?.aborted) return
        errors.push(
          error instanceof Error ? error.message : "Classification failed.",
        )
      }
      processed += 1
      options.onProgress?.(processed, images.length)
    }
  }
  await Promise.all(
    Array.from(
      { length: Math.max(1, Math.min(IMAGE_CONCURRENCY, images.length)) },
      worker,
    ),
  )
  return { results, errors }
}
