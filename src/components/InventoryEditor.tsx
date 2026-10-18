import { useEffect, useRef, useState } from "react"
import type { ComponentType } from "react"
import { Button, Form, Heading, Input, Select } from "./ui"
import { safeImageUrl } from "../lib/catalogue"
import { classificationCategories } from "../lib/classification"
import type { Product } from "../lib/catalogue"

type Props = {
  product: Product | null
  products: Product[]
  apiConnected: boolean
  Icon: ComponentType<{ name: string }>
  onSave: (product: Product) => boolean
  onDelete: (sku: string) => boolean
  onClose: () => void
}

export default function InventoryEditor({ product, products, apiConnected, Icon, onSave, onDelete, onClose }: Props) {
  const panel = useRef<HTMLElement>(null)
  const [name, setName] = useState(product?.name || "")
  const [sku, setSku] = useState(product?.sku || "")
  const [category, setCategory] = useState(product?.category || "Top")
  const [price, setPrice] = useState(String(product?.price ?? ""))
  const [color, setColor] = useState(product?.color || "")
  const [image, setImage] = useState(product?.imageUrl || "")
  const [variants, setVariants] = useState(
    product?.variants
      ? Object.entries(product.variants).map(([size, stock]) => ({ id: crypto.randomUUID(), size, stock: String(stock) }))
      : [{ id: crypto.randomUUID(), size: "M", stock: String(product?.stock ?? 0) }],
  )
  const [error, setError] = useState("")
  const [confirmManual, setConfirmManual] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => { panel.current?.focus() }, [])
  const total = variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0)
  const changeVariant = (id: string, changes: Partial<{ size: string; stock: string }>) =>
    setVariants((current) => current.map((variant) => variant.id === id ? { ...variant, ...changes } : variant))
  const save = () => {
    setError("")
    const sizes = variants.map((variant) => variant.size.trim().toUpperCase())
    const normalizedSku = sku.trim()
    if (!name.trim() || name.trim().length > 200) return setError("Enter a product name of up to 200 characters.")
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(normalizedSku)) return setError("Enter a valid product code using letters, numbers, dots, slashes, hyphens or underscores.")
    if (!product && products.some((p) => p.sku.toLowerCase() === normalizedSku.toLowerCase())) return setError("That product code is already in the inventory. Edit the existing product instead.")
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) > 1000000) return setError("Enter a price from ₱0 to ₱1,000,000 with up to two decimals.")
    if (!variants.length || sizes.some((size) => !/^[A-Z0-9][A-Z0-9 ./_-]{0,15}$/.test(size)) || new Set(sizes).size !== sizes.length) return setError("Provide at least one valid size. Each size must be unique.")
    if (variants.some((variant) => !/^\d+$/.test(variant.stock) || Number(variant.stock) > 1000000) || total > 1000000) return setError("Stock must be a whole number, with no more than 1,000,000 units in total.")
    if (color.trim().length > 80) return setError("Color must be at most 80 characters.")
    if (image.trim() && !safeImageUrl(image.trim())) return setError("Use a valid HTTP(S) image URL without credentials, or leave it empty.")
    if (apiConnected && !confirmManual) return setError("Confirm switching to manual inventory management before saving.")
    const next: Product = {
      name: name.trim(), sku: normalizedSku, category, price: Number(price), color: color.trim(),
      stock: total, variants: Object.fromEntries(variants.map((variant, index) => [sizes[index], Number(variant.stock)])),
      ...(image.trim() ? { imageUrl: safeImageUrl(image.trim())! } : {}), origin: "Manual",
    }
    if (!onSave(next)) setError("Could not save inventory in this browser. Your previous stock is unchanged.")
  }
  return (
    <section className="inventory-editor" aria-label={product ? `Edit ${product.name}` : "Add product"} ref={panel} tabIndex={-1}>
      <div className="inventory-editor-heading">
        <Heading level={2}>{product ? "Manage product & stock" : "Add product"}</Heading>
        <Button className="icon-button" aria-label="Close inventory editor" onClick={onClose}><Icon name="close" /></Button>
      </div>
      <Form onSubmit={(event) => { event.preventDefault(); save() }}>
        <div className="inventory-editor-fields">
          <label>Product name<Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={200} /></label>
          <label>Product code (SKU)<Input value={sku} onChange={(event) => setSku(event.target.value)} required readOnly={Boolean(product)} /></label>
          <label>Category<Select value={category} onChange={(event) => setCategory(event.target.value)}>
            {classificationCategories.map((value) => <option key={value}>{value}</option>)}
          </Select></label>
          <label>Price (₱)<Input type="number" min="0" max="1000000" step=".01" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
          <label>Color<Input value={color} onChange={(event) => setColor(event.target.value)} maxLength={80} /></label>
          <label>Image URL<Input type="url" value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://… (optional)" /></label>
        </div>
        <div className="inventory-editor-stock-heading">
          <Heading level={3}>Stock by size</Heading>
          <span>{total.toLocaleString("en-PH")} total units</span>
        </div>
        {product && !product.variants && <p className="inventory-editor-note">This product has no size-level records. Assign its available sizes and quantities below.</p>}
        <div className="inventory-variant-list">
          {variants.map((variant, index) => (
            <div className="inventory-variant-row" key={variant.id}>
              <label>Size<Input value={variant.size} onChange={(event) => changeVariant(variant.id, { size: event.target.value })} aria-label={`Size ${index + 1}`} required maxLength={16} /></label>
              <label>Available units<Input type="number" value={variant.stock} onChange={(event) => changeVariant(variant.id, { stock: event.target.value })} aria-label={`Stock for size ${variant.size || index + 1}`} min="0" max="1000000" step="1" required /></label>
              <Button className="icon-button" aria-label={`Remove size ${variant.size || index + 1}`} disabled={variants.length === 1} onClick={() => setVariants((current) => current.filter((row) => row.id !== variant.id))}><Icon name="trash" /></Button>
            </div>
          ))}
        </div>
        <Button className="text-button" onClick={() => setVariants((current) => [...current, { id: crypto.randomUUID(), size: "", stock: "0" }])}><Icon name="plus" />Add size</Button>
        {apiConnected && <label className="inventory-manual-confirm">
          <Input type="checkbox" checked={confirmManual} onChange={(event) => setConfirmManual(event.target.checked)} />
          <span>Switch to manual management. This disconnects API refresh so it cannot overwrite these edits; no retailer stock is changed.</span>
        </label>}
        {error && <p className="shop-error" role="alert">{error}</p>}
        <div className="inventory-editor-actions">
          <Button className="button secondary" onClick={onClose}>Cancel</Button>
          <Button className="button primary" type="submit">Save inventory<Icon name="check" /></Button>
        </div>
      </Form>
      {product && <div className="inventory-delete">
        {confirmDelete ? <>
          <p>Remove this product from your local catalogue? Existing retailer records are not changed.</p>
          <Button className="button secondary" onClick={() => setConfirmDelete(false)}>Keep product</Button>
          <Button className="button primary" disabled={apiConnected && !confirmManual} onClick={() => {
            if (!onDelete(product.sku)) setError("Could not remove the product. Your inventory is unchanged.")
          }}>Confirm removal</Button>
        </> : <Button className="text-button" onClick={() => setConfirmDelete(true)}><Icon name="trash" />Remove product</Button>}
      </div>}
      <p className="inventory-editor-note">Changes are saved in this browser tab and used by the customer builder. Zero stock marks a size unavailable.</p>
    </section>
  )
}
