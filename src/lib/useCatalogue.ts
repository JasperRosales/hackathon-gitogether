import { useEffect, useRef, useState } from "react"
import { useDispatch } from "react-redux"
import { setCatalogue as setCatalogueAction } from "./store"
import {
  catalogueKey,
  readCatalogue,
  fetchApiCatalogue,
  mergeCatalogue,
  safeApiEndpoint,
} from "./catalogue"
import type { Product, Catalogue } from "./catalogue"
import {
  applyClassifications,
  classifyProducts,
  isClassificationConfigured,
} from "./classification"

export type CatalogueSource = "CSV" | "API" | "Manual" | "AI"
export type SyncState = "idle" | "loading" | "error"

const classifiedKey = "forma-ai-classified-v1"

function productFingerprint(product: Product) {
  return `${product.name}|${product.price}|${product.color || ""}`
}

function readClassifiedMap(): Record<string, string> {
  try {
    const value = JSON.parse(sessionStorage.getItem(classifiedKey) || "null")
    if (value && typeof value === "object" && !Array.isArray(value))
      return value as Record<string, string>
  } catch {
    /* An unreadable map only means products are classified again. */
  }
  return {}
}

type Options = {
  /** Reports a short message to the user (toast). */
  notify: (text: string) => void
  /** True while a modal or manual refresh blocks background API refreshes. */
  isBusy: () => boolean
  /** Enables the background refresh loop (admin tab active and authorised). */
  active: boolean
}

/**
 * Owns the browser-local catalogue: persistence, CSV/API imports, manual
 * inventory edits and the optional background API refresh loop.
 */
export function useCatalogue({ notify, isBusy, active }: Options) {
  const dispatch = useDispatch()
  const [catalogue, setCatalogue] = useState(readCatalogue)
  useEffect(() => {
    dispatch(setCatalogueAction(catalogue))
  }, [catalogue, dispatch])
  const products = catalogue.products
  const [sync, setSync] = useState<SyncState>("idle")
  const [refreshInterval, setRefreshInterval] = useState(0)
  const refreshRequest = useRef<AbortController | null>(null)
  const refreshSequence = useRef(0)
  const [classifying, setClassifying] = useState(false)
  const classifiedMap = useRef<Record<string, string>>(readClassifiedMap())
  const failedSkus = useRef<Set<string>>(new Set())
  const classifyRequest = useRef<AbortController | null>(null)
  const commitClassified = (incoming: Product[]) => {
    const next: Catalogue = {
      products: incoming,
      source: "AI",
      updatedAt: new Date().toLocaleString(),
    }
    try {
      sessionStorage.setItem(catalogueKey, JSON.stringify(next))
    } catch {
      return false
    }
    setCatalogue(next)
    return true
  }

  const abortRefresh = () => {
    refreshSequence.current++
    refreshRequest.current?.abort()
    setSync("idle")
  }

  const applyCatalogue = (
    incoming: Product[],
    source: CatalogueSource,
    endpoint?: string,
    apiMode?: "merge" | "replace",
    background = false,
  ) => {
    const publicEndpoint =
      source === "API" ? safeApiEndpoint(endpoint || "") : undefined
    if (source === "API" && !publicEndpoint) return false
    const next: Catalogue = {
      products: incoming,
      source,
      updatedAt: new Date().toLocaleString(),
      ...(source === "API" ? { endpoint: publicEndpoint!, apiMode } : {}),
    }
    try {
      sessionStorage.setItem(catalogueKey, JSON.stringify(next))
    } catch {
      return false
    }
    refreshSequence.current++
    refreshRequest.current?.abort()
    setCatalogue(next)
    if (!background && (source !== "API" || endpoint !== catalogue.endpoint))
      setRefreshInterval(0)
    setSync("idle")
    if (!background && source !== "AI")
      notify(
        `${incoming.length} products available in this browser catalogue. No retailer API was changed.`,
      )
    return true
  }

  const importCatalogue = (incoming: Product[]) =>
    applyCatalogue(incoming, "CSV")

  const saveInventoryProduct = (product: Product) => {
    const exists = products.some((p) => p.sku === product.sku)
    const next = exists
      ? products.map((p) => (p.sku === product.sku ? product : p))
      : [...products, product]
    if (!applyCatalogue(next, "Manual")) return false
    notify(exists ? "Product and stock updated." : "Product added to your inventory.")
    return true
  }

  const deleteInventoryProduct = (sku: string) => {
    if (!applyCatalogue(products.filter((p) => p.sku !== sku), "Manual"))
      return false
    notify("Product removed from your local inventory.")
    return true
  }

  const connectCatalogue = (
    incoming: Product[],
    endpoint: string,
    mode: "merge" | "replace",
  ) =>
    applyCatalogue(
      mergeCatalogue(products, incoming, mode),
      "API",
      endpoint,
      mode,
    )

  const refreshApi = async (background = false) => {
    if (!catalogue.endpoint) return
    if (background && isBusy()) return
    refreshRequest.current?.abort()
    const controller = new AbortController()
    refreshRequest.current = controller
    const sequence = ++refreshSequence.current
    setSync("loading")
    try {
      const result = await fetchApiCatalogue(catalogue.endpoint, controller.signal)
      if (sequence !== refreshSequence.current || controller.signal.aborted)
        return
      if (result.errors.length) throw new Error(result.errors[0])
      if (
        !applyCatalogue(
          mergeCatalogue(products, result.products, catalogue.apiMode || "merge"),
          "API",
          catalogue.endpoint,
          catalogue.apiMode || "merge",
          background,
        )
      )
        throw new Error(
          "Browser storage is unavailable or full. Existing catalogue was retained.",
        )
    } catch (error) {
      if (sequence === refreshSequence.current && !controller.signal.aborted) {
        setSync("error")
        if (!background)
          notify(
            error instanceof Error
              ? error.message
              : "API refresh failed. Existing catalogue was retained.",
          )
      }
    }
  }

  const backgroundRefresh = useRef(refreshApi)
  backgroundRefresh.current = refreshApi
  useEffect(() => {
    if (
      !active ||
      !refreshInterval ||
      catalogue.source !== "API" ||
      !catalogue.endpoint
    )
      return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(async () => {
        if (cancelled) return
        if (document.visibilityState === "visible")
          await backgroundRefresh.current(true)
        if (!cancelled) schedule()
      }, refreshInterval * 1000)
    }
    schedule()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active, refreshInterval, catalogue.source, catalogue.endpoint])

  // AI auto-tagging: classify products that are new or edited since last tagged.
  useEffect(() => {
    if (!isClassificationConfigured()) return
    if (catalogue.source === "None" || !products.length) return
    const known = classifiedMap.current
    const unique = new Map<string, Product>()
    for (const product of products) unique.set(product.sku, product)
    const fresh = Array.from(unique.values()).filter(
      (product) =>
        product.origin !== "AI" &&
        known[product.sku] !== productFingerprint(product) &&
        !failedSkus.current.has(product.sku),
    )
    if (!fresh.length) return
    const controller = new AbortController()
    classifyRequest.current?.abort()
    classifyRequest.current = controller
    setClassifying(true)
    void (async () => {
      try {
        const outcome = await classifyProducts(fresh, {
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (outcome.results.length) {
          for (const result of outcome.results) {
            const product = unique.get(result.sku)
            if (product) known[result.sku] = productFingerprint(product)
          }
          try {
            sessionStorage.setItem(classifiedKey, JSON.stringify(known))
          } catch {
            /* Fingerprinting stays in memory when storage is blocked. */
          }
          const updated = applyClassifications(
            Array.from(unique.values()),
            outcome.results,
          )
          if (commitClassified(updated))
            notify(
              `AI tagged ${outcome.results.length} product${
                outcome.results.length === 1 ? "" : "s"
              }.`,
            )
        }
        if (outcome.errors.length) {
          for (const product of fresh) failedSkus.current.add(product.sku)
          notify(`AI tagging stopped: ${outcome.errors[0]}`)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          for (const product of fresh) failedSkus.current.add(product.sku)
          notify(
            error instanceof Error
              ? `AI tagging failed: ${error.message}`
              : "AI tagging failed.",
          )
        }
      } finally {
        if (classifyRequest.current === controller) {
          classifyRequest.current = null
          setClassifying(false)
        }
      }
    })()
  }, [products, catalogue.source])

  useEffect(
    () => () => {
      refreshSequence.current++
      refreshRequest.current?.abort()
      classifyRequest.current?.abort()
    },
    [],
  )

  return {
    catalogue,
    products,
    sync,
    setSync,
    refreshInterval,
    setRefreshInterval,
    abortRefresh,
    applyCatalogue,
    importCatalogue,
    saveInventoryProduct,
    deleteInventoryProduct,
    connectCatalogue,
    refreshApi,
    classifying,
  }
}

export type CatalogueApi = ReturnType<typeof useCatalogue>
