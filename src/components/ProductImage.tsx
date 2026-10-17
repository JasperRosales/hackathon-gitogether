import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import type { Product } from "../lib/catalogue"

type Props = {
  product: Product
  Garment: ComponentType<{ type: string }>
}
export default function ProductImage({ product, Garment }: Props) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [product.imageUrl])
  return product.imageUrl && !failed ? (
    <img
      className="catalogue-product-image"
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <Garment type={product.category} />
  )
}
