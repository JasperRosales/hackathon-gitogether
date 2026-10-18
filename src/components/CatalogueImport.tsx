import { useEffect, useRef, useState } from "react"
import type { ComponentType } from "react"
import { Button, Heading, Input, Select } from "./ui"
import ProductImage from "./ProductImage"
import { mergeCatalogue, parseCatalogueCsv } from "../lib/catalogue"
import { categoryList } from "../lib/classification"
import type { Product } from "../lib/catalogue"

type Props = {
  products: Product[]
  Icon: ComponentType<{ name: string }>
  Garment: ComponentType<{ type: string }>
  onClose: () => void
  onImport: (products: Product[]) => boolean
}
const template =
  "sku,name,category,price,image_url,size,stock,color\nSHOP-SH-01,Cotton shirt,Top,1490.00,https://images.unsplash.com/photo-1619086303291-0ef7699e4b31,S,12,White\nSHOP-SH-01,Cotton shirt,Top,1490.00,https://images.unsplash.com/photo-1619086303291-0ef7699e4b31,M,18,White\nSHOP-TR-01,Tailored trousers,Bottom,2490.00,https://images.unsplash.com/photo-1593030761757-71fae45fa0e7,M,20,Stone\nSHOP-SN-01,Canvas sneakers,Footwear,2290.00,https://images.unsplash.com/photo-1666728514990-dd5bf3565324,M,15,White\nSHOP-GW-01,Satin evening gown,Dress,5990.00,https://images.unsplash.com/photo-1566174053879-31528523f8ae,M,8,Ivory\nSHOP-BG-01,Leather shoulder bag,Accessory,3290.00,https://images.unsplash.com/photo-1584917865442-de89df76afd3,M,10,Tan\n"
export default function CatalogueImport({
  products,
  Icon,
  Garment,
  onClose,
  onImport,
}: Props) {
  const [mode, setMode] = useState<"merge" | "replace">("merge")
  const [name, setName] = useState("")
  const [incoming, setIncoming] = useState<Product[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [records, setRecords] = useState(0)
  const [reading, setReading] = useState(false)
  const upload = useRef<HTMLInputElement>(null)
  const sequence = useRef(0)
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    panel.current?.focus()
    panel.current?.scrollIntoView({ block: "nearest" })
    return () => {
      sequence.current++
    }
  }, [])
  const chooseFile = async (file: File) => {
    const request = ++sequence.current
    setName(file.name)
    setIncoming([])
    setErrors([])
    setRecords(0)
    if (
      !file.name.toLowerCase().endsWith(".csv") ||
      file.size > 2 * 1024 * 1024
    ) {
      setReading(false)
      setErrors(["Choose a CSV file under 2 MB."])
      return
    }
    setReading(true)
    try {
      const text = await file.text()
      if (request !== sequence.current) return
      const result = parseCatalogueCsv(text)
      setIncoming(result.products)
      setErrors(result.errors)
      setRecords(result.records)
    } catch {
      if (request === sequence.current)
        setErrors(["Could not read this file. Choose it again."])
    } finally {
      if (request === sequence.current) setReading(false)
    }
  }
  const downloadTemplate = () => {
    const url = URL.createObjectURL(
      new Blob([template], { type: "text/csv;charset=utf-8" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "forma-catalogue-template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }
  const updated = incoming.filter((p) =>
    products.some((existing) => existing.sku === p.sku),
  ).length
  return (
    <section
      className="catalogue-import"
      aria-labelledby="import-title"
      ref={panel}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose()
      }}
    >
      <div className="details-heading">
        <div>
          <span className="eyebrow">CATALOGUE & INVENTORY</span>
          <Heading level={3} id="import-title">
            Import your catalogue
          </Heading>
        </div>
        <Button
          className="icon-button"
          aria-label="Close import"
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
      </div>
      <div className="import-layout">
        <div className="import-file-area">
          <Icon name="upload" />
          <strong>{name || "Choose your product CSV"}</strong>
          <span>One row per product size · CSV up to 2 MB</span>
          <Button
            className="button primary"
            disabled={reading}
            onClick={() => upload.current?.click()}
          >
            {reading
              ? "Validating…"
              : name
                ? "Choose another file"
                : "Select CSV file"}
          </Button>
          <Input
            ref={upload}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void chooseFile(file)
              e.target.value = ""
            }}
          />
        </div>
        <div className="import-schema">
          <strong>Required columns</strong>
          <code>sku, name, category, price, image_url, size, stock</code>
          <p>
            Optional: color. Categories: {categoryList()}. Aliases such as Gown,
            Jumpsuit, Handbag or Sneakers are matched to the closest category.
            Repeat a SKU for each size; product fields must match. Prices are in
            Philippine pesos (PHP).
          </p>
          <p>
            Images use public HTTP(S) URLs. They are fetched when displayed, not
            uploaded or hosted by Forma.
          </p>
          <Button className="text-button" onClick={downloadTemplate}>
            Download CSV template
            <Icon name="arrow" />
          </Button>
        </div>
      </div>
      {errors.length > 0 && (
        <div className="import-errors" role="alert">
          <strong>Import blocked. Existing catalogue is unchanged.</strong>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {incoming.length > 0 && !errors.length && (
        <>
          <div className="import-preview-heading">
            <strong>
              {incoming.length} products · {records} size records
            </strong>
            <label>
              Import mode
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
            <table aria-label="CSV import preview">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Category</th>
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
                    <td>{p.category}</td>
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
          {incoming.length > 5 && (
            <p className="details-note">
              Showing the first 5 products. All {incoming.length} will be
              imported.
            </p>
          )}
          <p className="details-note">
            {mode === "replace"
              ? `Replaces all ${products.length} current products with this file.`
              : `${incoming.length - updated} new products, ${updated} updated. Each updated SKU replaces its full size/stock list.`}
          </p>
          <Button
            className="button primary"
            disabled={reading}
            onClick={() => {
              if (!onImport(mergeCatalogue(products, incoming, mode)))
                setErrors([
                  "Browser storage is unavailable or full. Nothing was imported.",
                ])
            }}
          >
            Confirm {mode === "replace" ? "replacement" : "import"}
            <Icon name="check" />
          </Button>
        </>
      )}
      <p className="import-local-note">
        Local browser import only. Saved in this tab through refresh and shared
        with the customer shop here. Not uploaded to a server, connected to a
        retailer API, or synchronized across devices.
      </p>
    </section>
  )
}
