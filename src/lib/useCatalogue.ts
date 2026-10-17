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

export type CatalogueSource = "CSV" | "API" | "Manual"
export type SyncState = "idle" | "loading" | "error"

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
export function useCatalogue(sample: Product[], { notify, isBusy, active }: Options) {
  const dispatch = useDispatch()
  const [catalogue, setCatalogue] = useState(() => readCatalogue(sample))
  useEffect(() => {
    dispatch(setCatalogueAction(catalogue))
  }, [catalogue, dispatch])
  const products = catalogue.products
  const [sync, setSync] = useState<SyncState>("idle")
  const [refreshInterval, setRefreshInterval] = useState(0)
  const refreshRequest = useRef<AbortController | null>(null)
  const refreshSequence = useRef(0)

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
    if (!background)
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

  useEffect(
    () => () => {
      refreshSequence.current++
      refreshRequest.current?.abort()
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
  }
}

export type CatalogueApi = ReturnType<typeof useCatalogue>
