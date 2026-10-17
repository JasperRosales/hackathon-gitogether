import { Button, Heading, Select } from "@/components/ui"
import { Icon } from "@/components/Icon"
import PanelTitle from "@/components/PanelTitle"
import ExperienceLanding from "@/components/ExperienceLanding"
import { productSizes, variantStock } from "@/lib/catalogue"
import type { Catalogue, Product } from "@/lib/catalogue"

type Props = {
  products: Product[]
  catalogue: Catalogue
  sourceLabel: string
  period: string
  setPeriod: (period: string) => void
  onOpenInventory: () => void
  onReviewProduct: (sku: string) => void
}

export default function HomeDashboard({
  products,
  catalogue,
  sourceLabel,
  period,
  setPeriod,
  onOpenInventory,
  onReviewProduct,
}: Props) {
  const unavailableProducts = products.filter((p) => p.stock === 0)
  const firstException = unavailableProducts[0]
  const variantStatuses = products.flatMap((p) =>
    productSizes(p).map((size) => variantStock(p, size) > 0),
  )
  const availability = variantStatuses.length
    ? `${((variantStatuses.filter(Boolean).length / variantStatuses.length) * 100).toFixed(1)}%`
    : "—"
  const scrollToMetrics = () =>
    document.getElementById("admin-metrics")?.scrollIntoView({ behavior: "smooth" })
  return (
    <>
      <ExperienceLanding
        audience="merchant"
        productCount={products.length}
        source={sourceLabel}
        Icon={Icon}
        onPrimary={onOpenInventory}
        onSecondary={scrollToMetrics}
      />
      <div id="admin-metrics" className="section-toolbar period-only">
        <Select
          aria-label="Reporting period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>Last 30 days</option>
          <option>Last 7 days</option>
        </Select>
      </div>
      <div className="metric-grid">
        {[
          [
            "Recommendation-assisted sales",
            period === "Last 7 days" ? "₱8,240" : "₱38,492",
            "from recommendation-assisted orders",
            period === "Last 7 days" ? "+8.1%" : "+12.4%",
          ],
          [
            "Average order value",
            period === "Last 7 days" ? "₱4,120" : "₱4,811.50",
            "per recommendation-assisted order",
            period === "Last 7 days" ? "+4.2%" : "+8.7%",
          ],
          [
            "Multi-item order share",
            period === "Last 7 days" ? "22.1%" : "24.6%",
            "assisted orders with two or more garments",
            period === "Last 7 days" ? "+1.2 pp" : "+2.5 pp",
          ],
          [
            "Recommendation engagement",
            period === "Last 7 days" ? "17.8%" : "19.2%",
            "displayed recommendations selected",
            period === "Last 7 days" ? "+0.8 pp" : "+1.4 pp",
          ],
        ].map(([label, value, detail, delta], index) => (
          <section
            className={`metric-card ${index === 0 ? "metric-featured" : ""}`}
            key={label}
          >
            <div className="metric-label">
              {label}
              <span className="metric-icon">
                <Icon name={["bag", "catalogue", "layers", "check"][index % 4]} />
              </span>
            </div>
            <div className="metric-reading">
              <div className="metric-value">{value}</div>
              <span className="metric-delta" aria-label={`${delta} versus previous period`}>{delta}</span>
            </div>
            <p>{detail}</p>
          </section>
        ))}
      </div>
      <div className="middle-grid">
        <section className="panel">
          <PanelTitle
            title="Studio-assisted revenue"
            trailing={<span className="chip">PHP</span>}
          />
          <div className="revenue-summary">
            <strong>
              {period === "Last 7 days" ? "₱8,240" : "₱38,492"}
              <span> +16.2%</span>
            </strong>
            <div className="chart-legend">
              <i />
              Studio-assisted <i className="outline-dot" />
              Store baseline
            </div>
          </div>
          <div className="chart">
            <div className="axis">
              <span>₱12k</span>
              <span>₱8k</span>
              <span>₱4k</span>
              <span>₱0</span>
            </div>
            <svg
              viewBox="0 0 680 150"
              preserveAspectRatio="none"
              role="img"
              aria-label="Illustrative studio-assisted revenue rises from 4,000 to 12,000 dollars over four weeks"
            >
              {[10, 50, 90, 130].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="680"
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                />
              ))}
              <path
                d="M0 120 30 114 60 122 90 90 120 96 150 82 180 87 210 64 240 76 270 63 300 70 330 50 360 61 390 42 420 56 450 32 480 40 510 22 540 35 570 16 600 23 640 8 680 14"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="2.5"
              />
              <path
                d="M0 133 30 127 60 135 90 120 120 126 150 113 180 122 210 105 240 115 270 95 300 107 330 89 360 98 390 80 420 92 450 70 480 80 510 60 540 72 570 56 600 64 640 48 680 55"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
            </svg>
            <div className="x-axis">
              <span>Jun 01</span>
              <span>Jun 07</span>
              <span>Jun 14</span>
              <span>Jun 21</span>
              <span>Jun 30</span>
            </div>
          </div>
          <div className="panel-foot">
            Attribution window: 7 days <span>2,846 sessions</span>
          </div>
        </section>
        <section className="panel operations-panel">
          <PanelTitle
            title="Needs your attention"
            trailing={<span className="chip">{unavailableProducts.length}</span>}
          />
          <div className="attention-item">
            <span className="attention-icon">
              <Icon name="catalogue" />
            </span>
            <div>
              <strong>
                {firstException ? "Product out of stock" : "No product stock exceptions"}
              </strong>
              {firstException && (
                <p>
                  {firstException.name} · {firstException.sku}
                </p>
              )}
            </div>
          </div>
          <Button
            className="button secondary"
            disabled={!firstException}
            onClick={() => onReviewProduct(firstException?.sku || "")}
          >
            Review stock exception <Icon name="arrow" />
          </Button>
          <div className="operation-stat">
            <span>Local size availability</span>
            <strong>{availability}</strong>
          </div>
          <progress
            className="availability-track"
            value={variantStatuses.filter(Boolean).length}
            max={variantStatuses.length || 1}
            aria-label="Local size availability"
          />
          <div className="operation-stat">
            <span>Catalogue source</span>
            <span>{sourceLabel}</span>
          </div>
          <div className="operation-note">
            {catalogue.source === "API"
              ? "Read-only API snapshot · manual refresh"
              : "No live API connection"}
          </div>
        </section>
      </div>
      <section className="panel affinity-panel">
        <PanelTitle title="Top outfit combinations" />
        <div className="table-wrap">
          <table className="affinity-table" aria-label="Outfit performance">
            <thead>
              <tr>
                <th scope="col">Outfit</th>
                <th scope="col" className="numeric-cell">Sessions</th>
                <th scope="col" className="numeric-cell">Conversion</th>
                <th scope="col">Leading swap pattern</th>
                <th scope="col">Promotion pairing</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "The everyday edit",
                  "Linen blazer + cotton shirt + trousers",
                  "1,248",
                  "8.4%",
                  "Loafers → sneakers · 18%",
                  "Cotton shirt + tailored trousers",
                ],
                [
                  "Modern essentials",
                  "Cotton vest + trousers + sneakers",
                  "986",
                  "7.2%",
                  "Vest → cotton shirt · 12%",
                  "Essential cotton shirt",
                ],
                [
                  "The weekend uniform",
                  "Cotton shirt + trousers + shoulder bag",
                  "612",
                  "6.8%",
                  "Bag removed · 9%",
                  "Leather shoulder bag",
                ],
              ].map(([title, desc, sessions, rate, swap, opportunity], i) => (
                <tr key={title}>
                  <td>
                    <div className="outfit-cell">
                      <span className="row-number">0{i + 1}</span>
                      <div>
                        <strong>{title}</strong>
                        <small>{desc}</small>
                      </div>
                    </div>
                  </td>
                  <td className="numeric-cell">{sessions}</td>
                  <td className="numeric-cell">
                    <strong className="conversion-value">{rate}</strong>
                  </td>
                  <td>
                    <span className="swap-pattern">{swap}</span>
                  </td>
                  <td>
                    <span className="opportunity-insight">{opportunity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="middle-grid intelligence-details">
        <section className="panel">
          <PanelTitle title="Frequently swapped items" />
          <div className="table-wrap">
            <table aria-label="Frequently swapped items">
              <thead>
                <tr>
                  <th scope="col">Original item</th>
                  <th scope="col">Customer preference</th>
                  <th scope="col">Swap share</th>
                  <th scope="col">Suggested action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Leather loafers", "Canvas sneakers", "18%", "Test a casual footwear pairing"],
                  ["Cotton vest", "Cotton shirt", "12%", "Offer a shirt-led alternative"],
                  ["Shoulder bag", "No accessory", "9%", "Keep accessories optional"],
                ].map(([original, replacement, share, action]) => (
                  <tr key={original}>
                    <td>{original}</td>
                    <td>{replacement}</td>
                    <td className="numeric-cell">{share}</td>
                    <td><span className="opportunity-insight">{action}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <PanelTitle title="Products worth promoting" />
          <div className="table-wrap">
            <table aria-label="In-stock promotion candidates">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Available units</th>
                  <th scope="col">Next step</th>
                </tr>
              </thead>
              <tbody>
                {[...products].filter((p) => p.stock > 0)
                  .sort((a, b) => b.stock - a.stock).slice(0, 3)
                  .map((p) => (
                    <tr key={p.sku}>
                      <td>{p.name}</td>
                      <td className="numeric-cell">{p.stock}</td>
                      <td>
                        <Button className="table-action" onClick={() => onReviewProduct(p.sku)}>
                          Review product <Icon name="arrow" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                {!products.some((p) => p.stock > 0) && (
                  <tr><td colSpan={3}>No in-stock products to promote.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="panel-foot">Highest available stock first. Review demand and margins before promoting.</div>
        </section>
      </div>
    </>
  )
}
