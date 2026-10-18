import type { Product } from "./catalogue"

export const classificationCategories = [
  "Top",
  "Bottom",
  "Dress",
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

export function cleanCategoryLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Every spelling, synonym and merchandising term that maps to a category. */
export const categoryAliases: Record<string, ClassificationCategory> = {
  // Tops: shirts, knitwear, bodysuits and casual layers.
  top: "Top",
  tops: "Top",
  shirt: "Top",
  shirts: "Top",
  tshirt: "Top",
  tshirts: "Top",
  tee: "Top",
  tees: "Top",
  blouse: "Top",
  blouses: "Top",
  tank: "Top",
  tanktop: "Top",
  "tank top": "Top",
  cami: "Top",
  camisole: "Top",
  "crop top": "Top",
  bra: "Top",
  bras: "Top",
  sportsbra: "Top",
  "sports bra": "Top",
  halter: "Top",
  polo: "Top",
  "polo shirt": "Top",
  sweater: "Top",
  sweaters: "Top",
  sweatshirt: "Top",
  sweatshirts: "Top",
  hoodie: "Top",
  hoodies: "Top",
  pullover: "Top",
  jumper: "Top",
  vest: "Top",
  tunic: "Top",
  bodysuit: "Top",
  corset: "Top",
  henley: "Top",
  turtleneck: "Top",
  "mock neck": "Top",
  "crew neck": "Top",
  flannel: "Top",
  singlet: "Top",
  undershirt: "Top",
  "oxford shirt": "Top",
  kurta: "Top",
  kurti: "Top",
  // Bottoms: trousers, denim, skirts and legwear.
  bottom: "Bottom",
  bottoms: "Bottom",
  pants: "Bottom",
  trousers: "Bottom",
  jeans: "Bottom",
  denim: "Bottom",
  shorts: "Bottom",
  skirt: "Bottom",
  skirts: "Bottom",
  joggers: "Bottom",
  sweatpants: "Bottom",
  leggings: "Bottom",
  chinos: "Bottom",
  chino: "Bottom",
  cargopants: "Bottom",
  "cargo pants": "Bottom",
  cargo: "Bottom",
  slacks: "Bottom",
  palazzo: "Bottom",
  culottes: "Bottom",
  "skinny jeans": "Bottom",
  "denim shorts": "Bottom",
  "swim trunks": "Bottom",
  boardshorts: "Bottom",
  swimsuit: "Bottom",
  swimwear: "Bottom",
  bikini: "Bottom",
  "bathing suit": "Bottom",
  underwear: "Bottom",
  underpants: "Bottom",
  briefs: "Bottom",
  boxers: "Bottom",
  bloomers: "Bottom",
  // One-piece garments: gowns, dresses, jumpsuits and playsuits.
  dress: "Dress",
  dresses: "Dress",
  gown: "Dress",
  gowns: "Dress",
  "ball gown": "Dress",
  ballgown: "Dress",
  "evening gown": "Dress",
  "cocktail dress": "Dress",
  sundress: "Dress",
  "maxi dress": "Dress",
  "mini dress": "Dress",
  "shift dress": "Dress",
  "wrap dress": "Dress",
  "sheath dress": "Dress",
  "party dress": "Dress",
  "formal gown": "Dress",
  "prom gown": "Dress",
  "wedding dress": "Dress",
  "wedding gown": "Dress",
  "bridal gown": "Dress",
  "bridesmaid dress": "Dress",
  nightgown: "Dress",
  negligee: "Dress",
  pinafore: "Dress",
  jumpsuit: "Dress",
  jumpsuits: "Dress",
  romper: "Dress",
  rompers: "Dress",
  playsuit: "Dress",
  overall: "Dress",
  overalls: "Dress",
  dungarees: "Dress",
  sari: "Dress",
  saree: "Dress",
  kaftan: "Dress",
  caftan: "Dress",
  onesie: "Dress",
  "one piece": "Dress",
  catsuit: "Dress",
  unitard: "Dress",
  leotard: "Dress",
  // Outerwear: jackets, coats, blazers and warm layers.
  outerwear: "Outerwear",
  jacket: "Outerwear",
  jackets: "Outerwear",
  coat: "Outerwear",
  coats: "Outerwear",
  blazer: "Outerwear",
  blazers: "Outerwear",
  cardigan: "Outerwear",
  cardigans: "Outerwear",
  parka: "Outerwear",
  anorak: "Outerwear",
  bomber: "Outerwear",
  "bomber jacket": "Outerwear",
  windbreaker: "Outerwear",
  raincoat: "Outerwear",
  "rain jacket": "Outerwear",
  overcoat: "Outerwear",
  peacoat: "Outerwear",
  "pea coat": "Outerwear",
  trench: "Outerwear",
  "trench coat": "Outerwear",
  gilet: "Outerwear",
  puffer: "Outerwear",
  "puffer vest": "Outerwear",
  "down jacket": "Outerwear",
  "leather jacket": "Outerwear",
  kimono: "Outerwear",
  robe: "Outerwear",
  bathrobe: "Outerwear",
  "bath robe": "Outerwear",
  "dressing gown": "Outerwear",
  shrug: "Outerwear",
  cape: "Outerwear",
  poncho: "Outerwear",
  duster: "Outerwear",
  cloak: "Outerwear",
  "fur coat": "Outerwear",
  "faux fur coat": "Outerwear",
  "snow jacket": "Outerwear",
  // Footwear: shoes, boots, heels and sandals.
  footwear: "Footwear",
  shoe: "Footwear",
  shoes: "Footwear",
  sneaker: "Footwear",
  sneakers: "Footwear",
  trainer: "Footwear",
  trainers: "Footwear",
  boot: "Footwear",
  boots: "Footwear",
  "ankle boots": "Footwear",
  "combat boots": "Footwear",
  heel: "Footwear",
  heels: "Footwear",
  "high heels": "Footwear",
  stiletto: "Footwear",
  stilettos: "Footwear",
  sandal: "Footwear",
  sandals: "Footwear",
  "flip flop": "Footwear",
  "flip flops": "Footwear",
  flipflops: "Footwear",
  loafer: "Footwear",
  loafers: "Footwear",
  "oxford shoe": "Footwear",
  "oxford shoes": "Footwear",
  "derby shoe": "Footwear",
  moccasin: "Footwear",
  moccasins: "Footwear",
  clog: "Footwear",
  clogs: "Footwear",
  slipper: "Footwear",
  slippers: "Footwear",
  wedge: "Footwear",
  wedges: "Footwear",
  pump: "Footwear",
  pumps: "Footwear",
  espadrille: "Footwear",
  espadrilles: "Footwear",
  brogue: "Footwear",
  brogues: "Footwear",
  cleat: "Footwear",
  "running shoe": "Footwear",
  "basketball shoe": "Footwear",
  "chelsea boot": "Footwear",
  // Accessories: bags, hats, jewellery, belts and small goods.
  accessory: "Accessory",
  accessories: "Accessory",
  bag: "Accessory",
  bags: "Accessory",
  handbag: "Accessory",
  handbags: "Accessory",
  purse: "Accessory",
  purses: "Accessory",
  tote: "Accessory",
  "tote bag": "Accessory",
  clutch: "Accessory",
  backpack: "Accessory",
  rucksack: "Accessory",
  "sling bag": "Accessory",
  crossbody: "Accessory",
  "crossbody bag": "Accessory",
  "shoulder bag": "Accessory",
  "fanny pack": "Accessory",
  "bum bag": "Accessory",
  wallet: "Accessory",
  pouch: "Accessory",
  belt: "Accessory",
  belts: "Accessory",
  hat: "Accessory",
  hats: "Accessory",
  cap: "Accessory",
  caps: "Accessory",
  beanie: "Accessory",
  beret: "Accessory",
  headband: "Accessory",
  "hair band": "Accessory",
  "hair clip": "Accessory",
  hairpin: "Accessory",
  scrunchie: "Accessory",
  scarf: "Accessory",
  scarves: "Accessory",
  shawl: "Accessory",
  glove: "Accessory",
  gloves: "Accessory",
  mitten: "Accessory",
  mittens: "Accessory",
  sock: "Accessory",
  socks: "Accessory",
  stocking: "Accessory",
  stockings: "Accessory",
  tights: "Accessory",
  pantyhose: "Accessory",
  tie: "Accessory",
  necktie: "Accessory",
  "bow tie": "Accessory",
  "pocket square": "Accessory",
  cufflinks: "Accessory",
  watch: "Accessory",
  watches: "Accessory",
  jewelry: "Accessory",
  jewellery: "Accessory",
  necklace: "Accessory",
  necklaces: "Accessory",
  earring: "Accessory",
  earrings: "Accessory",
  bracelet: "Accessory",
  bracelets: "Accessory",
  ring: "Accessory",
  rings: "Accessory",
  pendant: "Accessory",
  brooch: "Accessory",
  choker: "Accessory",
  anklet: "Accessory",
  sunglasses: "Accessory",
  glasses: "Accessory",
  eyewear: "Accessory",
  spectacles: "Accessory",
  umbrella: "Accessory",
  "face mask": "Accessory",
  "lapel pin": "Accessory",
  keychain: "Accessory",
  "key ring": "Accessory",
}

type AliasEntry = {
  key: string
  tokens: string[]
  category: ClassificationCategory
}

/** Longest phrases win so "dress shirt" stays a Top while "gown" is a Dress. */
const aliasEntries: AliasEntry[] = Object.entries(categoryAliases)
  .map(([key, category]) => ({
    key,
    tokens: key.split(" "),
    category,
  }))
  .sort((a, b) => b.tokens.length - a.tokens.length || b.key.length - a.key.length)

/** Compound words such as "handbags" or "raincoats" are caught by these. */
const compoundAliases: AliasEntry[] = aliasEntries.filter(
  (entry) => entry.key.length >= 6,
)

export function normalizeCategory(
  value: unknown,
): ClassificationCategory | null {
  if (typeof value !== "string") return null
  const cleaned = cleanCategoryLabel(value)
  if (!cleaned) return null
  const direct = classificationCategories.find(
    (category) => cleanCategoryLabel(category) === cleaned,
  )
  if (direct) return direct
  const alias = categoryAliases[cleaned]
  if (alias) return alias
  const padded = ` ${cleaned} `
  for (const entry of aliasEntries) {
    if (padded.includes(` ${entry.key} `)) return entry.category
  }
  for (const entry of compoundAliases) {
    if (cleaned.includes(entry.key)) return entry.category
  }
  const tokens = new Set(cleaned.split(" ").filter(Boolean))
  let best: { entry: AliasEntry; score: number } | null = null
  for (const entry of aliasEntries) {
    const score = entry.tokens.filter((token) => tokens.has(token)).length
    if (score > 0 && (!best || score > best.score)) best = { entry, score }
  }
  return best ? best.entry.category : null
}

export function readClassificationConfig(
  env: ImportMetaEnv = import.meta.env,
): ClassificationConfig {
  return {
    apiKey: (env.VITE_AMD_CLOUD_API_KEY || "").trim(),
    baseUrl: (env.VITE_AMD_CLOUD_BASE_URL || DEFAULT_BASE_URL)
      .trim()
      .replace(/\/+$/, ""),
    model:
      (env.VITE_AMD_CLOUD_MODEL || env.VITE_AMD_CLOUD_VISION_MODEL || "").trim() ||
      DEFAULT_MODEL,
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
Use "Dress" for every one-piece garment: gowns, cocktail and wedding dresses, jumpsuits, rompers, playsuits, overalls, saris and nightgowns.
Use "Top" for shirts, blouses, hoodies, sweaters and bodysuits; "Bottom" for pants, jeans, skirts and shorts; "Outerwear" for jackets, coats and blazers; "Footwear" for shoes, boots, heels and sandals; "Accessory" for everything else, including bags, wallets, belts, hats, scarves, socks, watches and jewellery.
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
Look at the single clothing item, shoe or accessory in the photo.
Return JSON only, in the shape {"name":"...","category":"...","color":"...","confidence":0.0,"reason":"..."}.
"name" is a short catalogue title (2-6 words) in title case.
"category" must be exactly one of: ${categoryList()}.
"category" rules: gowns, cocktail and wedding dresses, jumpsuits and rompers are "Dress".
Shirts, blouses, hoodies and sweaters are "Top"; pants, jeans, skirts and shorts are "Bottom"; jackets, coats and blazers are "Outerwear"; shoes, boots and sandals are "Footwear".
Bags, backpacks, wallets, belts, hats, scarves, socks, watches and jewellery are "Accessory" — never invent another category.
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
              { type: "text", text: "Identify the item in this photo." },
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
