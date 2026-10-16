import { useEffect, useRef, useState } from "react"
import type { ComponentType } from "react"
import { Button, Form, Heading, Input, Select } from "./ui"
import ProductImage from "./ProductImage"
import { fetchApiCatalogue, safeApiEndpoint } from "../lib/catalogue"
import type { Product } from "../lib/catalogue"

type Props = {
  products: Product[]
  initialEndpoint?: string
  Icon: ComponentType<{ name: string }>
  Garment: ComponentType<{ type: string }>
  onClose: () => void
  onConnect: (
    products: Product[],
    endpoint: string,
    mode: "merge" | "replace",
  ) => boolean
}
const sampleResponse = JSON.stringify(
  {
    products: [
      {
        sku: "STORE-SH-01",
        name: "Cotton shirt",
        category: "Top",
        price: 1490,
        image_url: "https://store.example/shirt.jpg",
        color: "White",
        variants: [
          { size: "S", stock: 12 },
          { size: "M", stock: 18 },
        ],
      },
    ],
  },
  null,
  2,
)

export default function CatalogueApi({
  products,
  initialEndpoint = "",
  Icon,
  Garment,
  onClose,
  onConnect,
}: Props) {
  const [endpoint, setEndpoint] = useState(initialEndpoint)
  const [testedEndpoint, setTestedEndpoint] = useState("")
  const [mode, setMode] = useState<"merge" | "replace">("merge")
  const [incoming, setIncoming] = useState<Product[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState(0)
  const request = useRef<AbortController | null>(null)
  const sequence = useRef(0)
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    panel.current?.focus()
    panel.current?.scrollIntoView({ block: "nearest" })
    return () => {
      sequence.current++
      request.current?.abort()
    }
  }, [])
  const reset = () => {
    sequence.current++
    request.current?.abort()
    setLoading(false)
    setIncoming([])
    setErrors([])
    setTestedEndpoint("")
  }
  const testConnection = async () => {
    const url = safeApiEndpoint(endpoint.trim())
    if (!url) {
      setErrors([
        "Enter a public HTTPS URL without embedded credentials or secret query parameters.",
      ])
      return
    }
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const id = ++sequence.current
    setLoading(true)
    setErrors([])
    setIncoming([])
    setTestedEndpoint("")
    try {
      const result = await fetchApiCatalogue(url, controller.signal)
      if (id !== sequence.current) return
      setErrors(result.errors)
      setIncoming(result.products)
      setRecords(result.records)
      if (!result.errors.length && result.products.length)
        setTestedEndpoint(url)
    } catch (error) {
      if (id === sequence.current && !controller.signal.aborted)
        setErrors([
          error instanceof Error ? error.message : "API connection failed.",
        ])
    } finally {
      if (id === sequence.current) setLoading(false)
    }
  }
  const existing = incoming.filter((p) =>
    products.some((current) => current.sku === p.sku),
  ).length
  return (
    <section
      className="catalogue-import catalogue-api"
      ref={panel}
      tabIndex={-1}
      aria-labelledby="api-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      <div className="details-heading">
        <div>
          <span className="eyebrow">CATALOGUE & INVENTORY API</span>
          <Heading level={3} id="api-title">
            Connect a catalogue API
          </Heading>
        </div>
        <Button
          className="icon-button"
          aria-label="Close API connection"
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
      </div>
      <Form
        className="api-endpoint-form"
        onSubmit={(e) => {
          e.preventDefault()
          void testConnection()
        }}
      >
        <label htmlFor="catalogue-api-endpoint">
          JSON endpoint
          <Input
            id="catalogue-api-endpoint"
            type="url"
            required
            value={endpoint}
            onChange={(e) => {
              reset()
              setEndpoint(e.target.value)
            }}
            placeholder="https://your-store.example/api/catalogue"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <Button type="submit" className="button primary" disabled={loading}>
          <Icon name="link" />
          {loading ? "Testing…" : "Test & preview"}
        </Button>
        {loading && (
          <Button className="text-button" onClick={reset}>
            Cancel request
          </Button>
        )}
      </Form>
      <div className="api-contract">
        <div>
          <strong>Read-only JSON connection</strong>
          <p>
            The endpoint must allow CORS for this website. Return a product
            array or <code>{"{ products: [...] }"}</code>/
            <code>{"{ data: [...] }"}</code>. Each item can contain a size/stock
            row or a variants array/object.
          </p>
          <p>
            Canonical fields: sku, name, category, price, image_url (or
            imageUrl), size/stock or variants; color is optional. Maximum 2 MB
            and 5,000 size records.
          </p>
          <p>
            Private retailer credentials must stay on a backend proxy. Do not
            enter API keys, tokens or private data URLs here. No cookies or
            authorization headers are sent.
          </p>
        </div>
        <details>
          <summary>View JSON example</summary>
          <pre>{sampleResponse}</pre>
        </details>
      </div>
      {errors.length > 0 && (
        <div className="import-errors" role="alert">
          <strong>
            Connection not applied. Existing catalogue is unchanged.
          </strong>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {!!incoming.length && !!testedEndpoint && !errors.length && (
        <>
          <div className="import-preview-heading">
            <strong>
              API reachable · {incoming.length} products · {records} size
              records
            </strong>
            <label>
              Apply mode
              <Select
                value={mode}
                onChange={(e) => setMode(e.target.value as "merge" | "replace")}
              >
                <option value="merge">Add / update by SKU</option>
                <option value="replace">Replace entire catalogue</option>
              </Select>
            </label>
          </div>
          <div className="table-wrap">
            <table aria-label="API catalogue preview">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Price</th>
                  <th>Sizes / stock</th>
                </tr>
              </thead>
              <tbody>
                {incoming.slice(0, 5).map((p) => (
                  <tr key={p.sku}>
                    <td>
                      <div className="product-cell">
                        <div className="product-thumb">
                          <ProductImage product={p} Garment={Garment} />
                        </div>
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td>₱{p.price.toFixed(2)}</td>
                    <td>
                      {Object.entries(p.variants || {})
                        .map(([size, stock]) => `${size}: ${stock}`)
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="details-note">
            {mode === "replace"
              ? `Replaces all ${products.length} current products.`
              : `${incoming.length - existing} new products, ${existing} updated; matching SKUs replace all sizes.`}
            {incoming.length > 5
              ? ` Showing the first 5 of ${incoming.length} products.`
              : ""}
          </p>
          <Button
            className="button primary"
            onClick={() => {
              if (!onConnect(incoming, testedEndpoint, mode))
                setErrors([
                  "Browser storage is unavailable or full. No connection was saved.",
                ])
            }}
          >
            Use API snapshot
            <Icon name="check" />
          </Button>
        </>
      )}
      <p className="import-local-note">
        Testing only reads your endpoint. Confirmation saves a snapshot and
        public URL in this browser tab; use Refresh API to read it again. No
        automatic background sync, server-side connector or retailer data write
        is configured.
      </p>
    </section>
  )
}
