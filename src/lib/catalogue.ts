import Papa from "papaparse"
import {
  categoryList,
  isClassificationCategory,
  normalizeCategory,
} from "./classification"

export type Product = {
  name: string
  category: string
  sku: string
  price: number
  stock: number
  imageUrl?: string
  color?: string
  variants?: Record<string, number>
  origin?: "CSV" | "API" | "Manual" | "AI"
}
export type Catalogue = {
  products: Product[]
  source: "None" | "CSV" | "API" | "Manual" | "AI"
  updatedAt: string
  endpoint?: string
  apiMode?: "merge" | "replace"
}
type ImportResult = {
  products: Product[]
  errors: string[]
  records: number
}
export const catalogueKey = "forma-local-catalogue-v1"
export const defaultSizes = ["XS", "S", "M", "L", "XL"]
export function productColor(product: Product) {
  return product.color || "Unspecified"
}
export function variantStock(product: Product, size: string) {
  if (product.variants)
    return Object.prototype.hasOwnProperty.call(product.variants, size)
      ? product.variants[size]
      : 0
  if (!defaultSizes.includes(size)) return 0
  return product.stock
}
export function productSizes(product: Product) {
  return product.variants ? Object.keys(product.variants) : defaultSizes
}
export function productTotal(products: Product[]) {
  return (
    products.reduce(
      (sum, product) => sum + Math.round(product.price * 100),
      0,
    ) / 100
  )
}
export function catalogueSizes(products: Product[]) {
  return Array.from(new Set(products.flatMap(productSizes))).sort((a, b) =>
    defaultSizes.includes(a) && defaultSizes.includes(b)
      ? defaultSizes.indexOf(a) - defaultSizes.indexOf(b)
      : a.localeCompare(b, undefined, { numeric: true }),
  )
}
export function safeImageUrl(value: string) {
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

export function safeProductImage(value: string) {
  return /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(value)
    ? value
    : safeImageUrl(value)
}

export function parseCatalogueCsv(text: string): ImportResult {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), {
    skipEmptyLines: "greedy",
  })
  const errors = parsed.errors.map((error) => `CSV format: ${error.message}`)
  const rows = parsed.data
  return validateCatalogueRows(rows, errors)
}

function validateCatalogueRows(
  rows: string[][],
  errors: string[] = [],
): ImportResult {
  if (rows.length < 2)
    return {
      products: [],
      errors: [
        ...errors,
        "Include a header and at least one product-size record.",
      ],
      records: 0,
    }
  const headers = rows[0].map((header) => header.trim().toLowerCase())
  const required = [
    "sku",
    "name",
    "category",
    "price",
    "image_url",
    "size",
    "stock",
  ]
  for (const column of required)
    if (!headers.includes(column)) errors.push(`Missing column: ${column}`)
  if (new Set(headers).size !== headers.length)
    errors.push("Column names must be unique.")
  if (rows.length > 5001)
    errors.push("Import at most 5,000 product-size records per file.")
  if (errors.length) return { products: [], errors, records: rows.length - 1 }
  const grouped = new Map<string, Product>()
  const variants = new Set<string>()
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index]
    const get = (key: string) => (row[headers.indexOf(key)] || "").trim()
    const problems: string[] = []
    if (row.length !== headers.length)
      problems.push("column count does not match the header")
    const sku = get("sku"),
      name = get("name"),
      rawCategory = get("category"),
      category = normalizeCategory(rawCategory)
    const priceText = get("price"),
      stockText = get("stock"),
      size = get("size").toUpperCase(),
      color = get("color")
    const imageUrl = safeImageUrl(get("image_url"))
    if (!sku || sku.length > 100)
      problems.push("SKU must contain 1–100 characters")
    if (!name || name.length > 200)
      problems.push("name must contain 1–200 characters")
    if (!category)
      problems.push(`category must be one of: ${categoryList()}`)
    if (!/^\d+(?:\.\d{1,2})?$/.test(priceText) || Number(priceText) > 1000000)
      problems.push(
        "price must be a nonnegative amount with at most two decimals",
      )
    if (!/^\d+$/.test(stockText) || Number(stockText) > 1000000)
      problems.push("stock must be a whole number from 0 to 1,000,000")
    if (!/^[A-Z0-9][A-Z0-9 ./_-]{0,15}$/.test(size))
      problems.push("size must contain 1–16 letters or numbers")
    if (!imageUrl)
      problems.push(
        "image_url must be an HTTP(S) URL without embedded credentials",
      )
    if (color.length > 80) problems.push("color must be at most 80 characters")
    const variantId = JSON.stringify([sku, size])
    if (variants.has(variantId))
      problems.push(`duplicate SKU/size: ${sku} / ${size}`)
    const previous = grouped.get(sku)
    if (
      previous &&
      (previous.name !== name ||
        previous.category !== category ||
        previous.price !== Number(priceText) ||
        previous.imageUrl !== imageUrl ||
        (previous.color || "") !== color)
    )
      problems.push(
        "product fields must match across all sizes of the same SKU",
      )
    if (problems.length) {
      if (errors.length < 100)
        errors.push(`Record ${index}: ${problems.join("; ")}.`)
      continue
    }
    variants.add(variantId)
    const product = previous || {
      sku,
      name,
      category: category!,
      price: Number(priceText),
      stock: 0,
      imageUrl: imageUrl!,
      color,
      variants: Object.create(null) as Record<string, number>,
      origin: "CSV" as const,
    }
    product.variants![size] = Number(stockText)
    product.stock += Number(stockText)
    grouped.set(sku, product)
  }
  return {
    products: errors.length ? [] : Array.from(grouped.values()),
    errors,
    records: rows.length - 1,
  }
}
export function mergeCatalogue(
  current: Product[],
  incoming: Product[],
  mode: "merge" | "replace",
) {
  if (mode === "replace") return incoming
  const merged = new Map(current.map((product) => [product.sku, product]))
  for (const product of incoming) merged.set(product.sku, product)
  return Array.from(merged.values())
}
export function readCatalogue(): Catalogue {
  try {
    const value = JSON.parse(sessionStorage.getItem(catalogueKey) || "null")
    if (
      ["CSV", "API", "Manual", "AI"].includes(value?.source) &&
      (value.source !== "API" || safeApiEndpoint(value.endpoint)) &&
      typeof value.updatedAt === "string" &&
      Array.isArray(value.products) &&
      value.products.every(
        (p: Product) =>
          typeof p.sku === "string" &&
          typeof p.name === "string" &&
          isClassificationCategory(p.category) &&
          Number.isFinite(p.price) &&
          p.price >= 0 &&
          Number.isInteger(p.stock) &&
          p.stock >= 0 &&
          (!p.imageUrl || safeProductImage(p.imageUrl)) &&
          (!p.variants ||
            Object.entries(p.variants).every(
              ([size, stock]) =>
                /^[A-Z0-9][A-Z0-9 ./_-]{0,15}$/.test(size) &&
                Number.isInteger(stock) &&
                stock >= 0,
            )),
      )
    )
      return value
  } catch {
    /* Invalid or inaccessible storage falls back to an empty catalogue. */
  }
  // No built-in products: the catalogue starts empty until a merchant imports
  // a CSV, connects a public API or adds products manually.
  return { products: [], source: "None", updatedAt: "" }
}

export function safeApiEndpoint(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.username || url.password || url.hash)
      return null
    if (
      Array.from(url.searchParams.keys()).some((key) =>
        /token|key|secret|password|credential|authorization/i.test(key),
      )
    )
      return null
    return url.href
  } catch {
    return null
  }
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
export function parseCatalogueApi(value: unknown): ImportResult {
  const data = Array.isArray(value)
    ? value
    : record(value)
      ? (value.products ?? value.data)
      : null
  if (!Array.isArray(data) || !data.length)
    return {
      products: [],
      errors: [
        "Return a nonempty JSON array, or an object containing a products/data array.",
      ],
      records: 0,
    }
  if (data.length > 5000)
    return {
      products: [],
      errors: ["API snapshots support at most 5,000 size records."],
      records: 0,
    }
  const headers = [
    "sku",
    "name",
    "category",
    "price",
    "image_url",
    "size",
    "stock",
    "color",
  ]
  const rows: string[][] = [headers]
  const errors: string[] = []
  for (const [index, item] of data.entries()) {
    if (!record(item)) {
      errors.push(`Product ${index + 1} must be a JSON object.`)
      continue
    }
    const variants = Array.isArray(item.variants)
      ? item.variants
      : record(item.variants)
        ? Object.entries(item.variants).map(([size, stock]) => ({
            size,
            stock,
          }))
        : [item]
    if (!variants.length) {
      errors.push(`Product ${index + 1} must have at least one size record.`)
      continue
    }
    for (const variant of variants) {
      if (rows.length > 5000)
        return {
          products: [],
          errors: ["API snapshots support at most 5,000 size records."],
          records: rows.length - 1,
        }
      if (!record(variant)) {
        errors.push(`Product ${index + 1} contains an invalid variant.`)
        continue
      }
      const values = [
        item.sku,
        item.name,
        item.category,
        item.price,
        item.image_url ?? item.imageUrl,
        variant.size,
        variant.stock,
        item.color ?? "",
      ]
      if (
        values.some((field, fieldIndex) =>
          [3, 5, 6].includes(fieldIndex)
            ? typeof field !== "string" && typeof field !== "number"
            : typeof field !== "string",
        )
      ) {
        errors.push(
          `Product ${index + 1}: supply string metadata and numeric/string price, size and stock.`,
        )
        continue
      }
      rows.push(values.map((field) => String(field)))
    }
  }
  if (errors.length)
    return {
      products: [],
      errors: errors.slice(0, 100),
      records: rows.length - 1,
    }
  const result = validateCatalogueRows(rows)
  return {
    ...result,
    products: result.products.map((product) => ({ ...product, origin: "API" })),
  }
}

export async function fetchApiCatalogue(
  endpoint: string,
  signal?: AbortSignal,
): Promise<ImportResult> {
  const url = safeApiEndpoint(endpoint)
  if (!url)
    throw new Error(
      "Use an HTTPS endpoint without credentials or secret query parameters.",
    )
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    })
    if (!response.ok)
      throw new Error(
        `API returned HTTP ${response.status}. Existing catalogue is unchanged.`,
      )
    if (
      !/application\/(?:[a-z0-9.+-]*\+)?json/i.test(
        response.headers.get("content-type") || "",
      )
    )
      throw new Error(
        "The endpoint must return JSON with an application/json content type.",
      )
    const reader = response.body?.getReader()
    if (!reader) throw new Error("The API response has no readable body.")
    const decoder = new TextDecoder("utf-8", { fatal: true })
    let text = "",
      bytes = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        bytes += value.byteLength
        if (bytes > 2 * 1024 * 1024) {
          await reader.cancel()
          throw new Error("API snapshots must be under 2 MB.")
        }
        text += decoder.decode(value, { stream: true })
      }
      text += decoder.decode()
    } finally {
      reader.releaseLock()
    }
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      throw new Error("The API response is not valid JSON.")
    }
    return parseCatalogueApi(payload)
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        signal?.aborted
          ? "Request cancelled."
          : "API request timed out after 15 seconds.",
      )
    if (error instanceof TypeError)
      throw new Error(
        "Cannot reach this API. Check the endpoint and enable CORS for this site, or use a backend proxy.",
      )
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener("abort", abort)
  }
}
