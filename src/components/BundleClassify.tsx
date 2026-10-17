import { useEffect, useRef, useState } from "react"
import type { ComponentType } from "react"
import { Button, Heading, Input, Select } from "./ui"
import {
  classificationCategories,
  classifyImages,
  isClassificationConfigured,
} from "../lib/classification"
import type { ClassificationCategory } from "../lib/classification"
import type { Product } from "../lib/catalogue"

type Props = {
  products: Product[]
  Icon: ComponentType<{ name: string }>
  Garment: ComponentType<{ type: string }>
  onClose: () => void
  onApply: (products: Product[]) => boolean
}

type BundleItem = {
  id: string
  fileName: string
  dataUrl: string
  sku: string
  name: string
  category: ClassificationCategory
  color: string
  price: string
  stock: string
  confidence?: number
  status: "queued" | "classifying" | "ready" | "error" | "applied"
  error?: string
}

const MAX_FILES = 24
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"]

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read this file."))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not decode this image."))
    image.src = src
  })
}

async function prepareImage(file: File): Promise<string> {
  const raw = await readFile(file)
  const image = await loadImage(raw)
  const longest = Math.max(image.naturalWidth, image.naturalHeight) || 1
  const scale = Math.min(1, 640 / longest)
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) return raw
  context.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL("image/jpeg", 0.75)
}

function titleFromFile(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim()
  return (
    base
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ")
      .slice(0, 200) || "New garment"
  )
}

export default function BundleClassify({
  products,
  Icon,
  Garment,
  onClose,
  onApply,
}: Props) {
  const panel = useRef<HTMLElement>(null)
  const upload = useRef<HTMLInputElement>(null)
  const request = useRef<AbortController | null>(null)
  const sequence = useRef(0)
  const knownSkus = useRef<Set<string>>(new Set())
  const [items, setItems] = useState<BundleItem[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  })
  const [notices, setNotices] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const configured = isClassificationConfigured()

  useEffect(() => {
    panel.current?.focus()
    panel.current?.scrollIntoView({ block: "nearest" })
    return () => {
      sequence.current++
      request.current?.abort()
    }
  }, [])

  const nextSku = () => {
    let sku = ""
    do {
      sku = `AI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    } while (knownSkus.current.has(sku))
    knownSkus.current.add(sku)
    return sku
  }

  const patch = (id: string, changes: Partial<BundleItem>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    )

  const classify = async (targets: BundleItem[]) => {
    if (!configured || !targets.length) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const run = sequence.current
    const ids = new Set(targets.map((item) => item.id))
    setBusy(true)
    setErrors([])
    setProgress({ done: 0, total: targets.length })
    setItems((current) =>
      current.map((item) =>
        ids.has(item.id) && item.status !== "applied"
          ? { ...item, status: "classifying", error: undefined }
          : item,
      ),
    )
    const outcome = await classifyImages(
      targets.map((item) => ({ id: item.id, dataUrl: item.dataUrl })),
      {
        signal: controller.signal,
        onProgress: (done, total) => {
          if (run === sequence.current) setProgress({ done, total })
        },
      },
    )
    if (run !== sequence.current || controller.signal.aborted) return
    const byId = new Map(outcome.results.map((result) => [result.id, result]))
    setItems((current) =>
      current.map((item) => {
        if (!ids.has(item.id) || item.status === "applied") return item
        const result = byId.get(item.id)
        if (!result)
          return { ...item, status: "error", error: "Not identified" }
        return {
          ...item,
          status: "ready",
          name: result.name,
          category: result.category,
          color: result.color || item.color,
          confidence: result.confidence,
          error: undefined,
        }
      }),
    )
    setErrors(outcome.errors)
    setBusy(false)
  }

  const chooseFiles = async (files: File[]) => {
    setErrors([])
    setNotices([])
    if (!configured) {
      setNotices([
        "AI classification is off. Add VITE_AMD_CLOUD_API_KEY to the .env file and reload.",
      ])
      return
    }
    const messages: string[] = []
    const accepted = files.filter(
      (file) => ACCEPTED.includes(file.type) && file.size <= MAX_FILE_BYTES,
    )
    const rejected = files.length - accepted.length
    const room = MAX_FILES - items.length
    const chosen = accepted.slice(0, Math.max(0, room))
    if (rejected)
      messages.push(
        `${rejected} file${rejected === 1 ? "" : "s"} skipped. Use JPG, PNG or WebP under 10 MB.`,
      )
    if (accepted.length > chosen.length)
      messages.push(`A bundle can hold at most ${MAX_FILES} photos.`)
    for (const product of products) knownSkus.current.add(product.sku)
    const created: BundleItem[] = []
    for (const file of chosen) {
      try {
        const dataUrl = await prepareImage(file)
        created.push({
          id: crypto.randomUUID(),
          fileName: file.name,
          dataUrl,
          sku: nextSku(),
          name: titleFromFile(file.name),
          category: "Top",
          color: "",
          price: "0",
          stock: "10",
          status: "queued",
        })
      } catch {
        messages.push(`${file.name} could not be read.`)
      }
    }
    setNotices(messages)
    if (!created.length) return
    setItems((current) => [...current, ...created])
    void classify(created)
  }

  const retry = (item: BundleItem) => {
    void classify([item])
  }

  const removeItem = (id: string) =>
    setItems((current) => current.filter((item) => item.id !== id))

  const buildProduct = (item: BundleItem): Product | null => {
    const name = item.name.trim()
    const stock = Number(item.stock)
    const price = Number(item.price)
    if (!name || name.length > 200) return null
    if (!/^\d+(?:\.\d{1,2})?$/.test(item.price) || price > 1000000) return null
    if (!/^\d+$/.test(item.stock) || stock > 1000000) return null
    return {
      name,
      sku: item.sku,
      category: item.category,
      price,
      color: item.color.trim().slice(0, 80),
      stock,
      variants: { M: stock },
      imageUrl: item.dataUrl,
      origin: "AI",
    }
  }

  const applyItems = (targets: BundleItem[]) => {
    const products_: Product[] = []
    const invalid: string[] = []
    for (const item of targets) {
      const built = buildProduct(item)
      if (built) products_.push(built)
      else invalid.push(item.fileName)
    }
    if (invalid.length) {
      setErrors([`Check name and price for: ${invalid.join(", ")}.`])
      return
    }
    if (!products_.length) return
    if (!onApply(products_)) {
      setErrors([
        "Browser storage is unavailable or full. Remove some photos or clear the catalogue.",
      ])
      return
    }
    const applied = new Set(targets.map((item) => item.id))
    setItems((current) =>
      current.map((item) =>
        applied.has(item.id) ? { ...item, status: "applied" } : item,
      ),
    )
  }

  const ready = items.filter((item) => item.status === "ready")
  const pending = items.filter(
    (item) => item.status === "classifying" || item.status === "queued",
  )

  return (
    <section
      className="catalogue-import"
      aria-labelledby="bundle-title"
      ref={panel}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      <div className="details-heading">
        <div>
          <span className="eyebrow">CATALOGUE & INVENTORY</span>
          <Heading level={3} id="bundle-title">
            Classify a clothing bundle
          </Heading>
        </div>
        <Button
          className="icon-button"
          aria-label="Close bundle classifier"
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
      </div>
      <div className="import-layout">
        <div className="import-file-area">
          <Icon name="upload" />
          <strong>
            {items.length
              ? `${items.length} photo${items.length === 1 ? "" : "s"} in this bundle`
              : "Choose clothing photos"}
          </strong>
          <span>JPG, PNG or WebP · up to 10 MB each · {MAX_FILES} per bundle</span>
          <Button
            className="button primary"
            disabled={busy}
            onClick={() => upload.current?.click()}
          >
            {busy
              ? "Classifying…"
              : items.length
                ? "Add more photos"
                : "Select photos"}
          </Button>
          <Input
            ref={upload}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              e.target.value = ""
              if (files.length) void chooseFiles(files)
            }}
          />
        </div>
        <div className="import-schema">
          <strong>How it works</strong>
          <p>
            Each photo is sent to the AMD Cloud vision model, which identifies
            the garment and suggests a name, category and colour.
          </p>
          <p>
            Review the suggestions, adjust anything, then apply. Applied items
            are saved to the catalogue and appear in the customer shop, ready to
            use in try-on.
          </p>
          {!configured && (
            <p>
              AI classification is off until VITE_AMD_CLOUD_API_KEY is set in the
              .env file.
            </p>
          )}
        </div>
      </div>
      {busy && (
        <p className="details-note" role="status">
          Classifying {progress.done} of {progress.total}…
        </p>
      )}
      {(notices.length > 0 || errors.length > 0) && (
        <div className="import-errors" role="alert">
          <ul>
            {[...notices, ...errors].map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {items.length > 0 && (
        <>
          <div className="import-preview-heading">
            <strong>
              {ready.length} ready to apply · {pending.length} classifying ·{" "}
              {items.filter((item) => item.status === "applied").length} applied
            </strong>
            <Button
              className="button primary"
              disabled={busy || ready.length === 0}
              onClick={() => applyItems(ready)}
            >
              Apply all ready
              <Icon name="check" />
            </Button>
          </div>
          <div className="bundle-list">
            {items.map((item) => (
              <article className="bundle-item" key={item.id}>
                <div className="bundle-item-thumb">
                  {item.dataUrl ? (
                    <img src={item.dataUrl} alt={item.name} />
                  ) : (
                    <Garment type={item.category} />
                  )}
                </div>
                <div className="bundle-item-body">
                  <div className="bundle-item-fields">
                    <label>
                      Name
                      <Input
                        value={item.name}
                        maxLength={200}
                        disabled={item.status === "applied"}
                        onChange={(e) => patch(item.id, { name: e.target.value })}
                      />
                    </label>
                    <label>
                      Category
                      <Select
                        value={item.category}
                        disabled={item.status === "applied"}
                        onChange={(e) =>
                          patch(item.id, {
                            category: e.target.value as ClassificationCategory,
                          })
                        }
                      >
                        {classificationCategories.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </Select>
                    </label>
                    <label>
                      Color
                      <Input
                        value={item.color}
                        maxLength={80}
                        disabled={item.status === "applied"}
                        onChange={(e) => patch(item.id, { color: e.target.value })}
                      />
                    </label>
                    <label>
                      Price (₱)
                      <Input
                        type="number"
                        min="0"
                        max="1000000"
                        step=".01"
                        value={item.price}
                        disabled={item.status === "applied"}
                        onChange={(e) => patch(item.id, { price: e.target.value })}
                      />
                    </label>
                    <label>
                      Units (size M)
                      <Input
                        type="number"
                        min="0"
                        max="1000000"
                        step="1"
                        value={item.stock}
                        disabled={item.status === "applied"}
                        onChange={(e) => patch(item.id, { stock: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="bundle-item-foot">
                    <span className={`bundle-status ${item.status}`}>
                      {item.status === "classifying"
                        ? "Classifying…"
                        : item.status === "ready"
                          ? item.confidence !== undefined
                            ? `AI ready · ${Math.round(item.confidence * 100)}%`
                            : "AI ready"
                          : item.status === "applied"
                            ? `Saved · ${item.sku}`
                            : item.status === "error"
                              ? item.error || "Could not classify"
                              : "Queued"}
                    </span>
                    <span className="bundle-file">{item.fileName}</span>
                    {item.status === "error" && (
                      <Button
                        className="text-button"
                        disabled={busy}
                        onClick={() => retry(item)}
                      >
                        <Icon name="swap" />
                        Retry
                      </Button>
                    )}
                    {item.status !== "applied" && (
                      <Button
                        className="button secondary"
                        disabled={busy || item.status === "classifying"}
                        onClick={() => applyItems([item])}
                      >
                        Apply
                        <Icon name="check" />
                      </Button>
                    )}
                    {item.status !== "applied" && (
                      <Button
                        className="text-button"
                        aria-label={`Remove ${item.name || item.fileName} from the bundle`}
                        onClick={() => removeItem(item.id)}
                      >
                        <Icon name="trash" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <p className="import-local-note">
        Photos are downscaled in this browser and sent to AMD Cloud for
        identification, then stored locally in this tab so customers can view
        them and use them in try-on. Nothing is uploaded to a Forma server.
      </p>
    </section>
  )
}
