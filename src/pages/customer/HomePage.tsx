import { Button, Heading } from "@/components/ui"
import { Icon } from "@/components/Icon"
import ExperienceLanding from "@/components/ExperienceLanding"

type Props = {
  image: string
  category: string
  setCategory: (category: string) => void
  /** Landing primary CTA: "Build my outfit" — open the bundle builder. */
  onStartBuilder: () => void
  /** Landing secondary CTA: "Style a single piece". */
  onStyleSingle: () => void
  /** Home card CTA: browse the collection to purchase. */
  onShopPurchase: () => void
}

export default function HomePage({
  image,
  category,
  setCategory,
  onStartBuilder,
  onStyleSingle,
  onShopPurchase,
}: Props) {
  return (
    <>
      <ExperienceLanding
        audience="customer"
        image={image}
        Icon={Icon}
        onPrimary={onStartBuilder}
        onSecondary={onStyleSingle}
      />
      <section className="home-entry" aria-label="Start your flow">
        <div className="home-entry-heading">
          <Heading level={2}>Start your flow</Heading>
          <p>Pick a category, then choose how you want to shop.</p>
        </div>
        <div className="home-entry-steps">
          <div className="home-step">
            <span className="home-step-number" aria-hidden="true">1</span>
            <div>
              <strong>Choose a clothing category</strong>
              <div className="shop-categories home-categories" aria-label="Choose a category">
                {["All", "Top", "Bottom", "Outerwear", "Footwear", "Accessory"].map((c) => (
                  <Button
                    key={c}
                    className={c === category ? "selected" : ""}
                    aria-pressed={c === category}
                    onClick={() => setCategory(c)}
                  >
                    {c === "All" ? "All pieces" : c}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="home-step">
            <span className="home-step-number" aria-hidden="true">2</span>
            <div className="home-paths">
              <button className="home-path-card" onClick={onShopPurchase}>
                <span className="landing-feature-icon"><Icon name="bag" /></span>
                <strong>Purchase</strong>
                <small>Browse {category === "All" ? "the collection" : category} and add pieces straight to your cart.</small>
                <span className="text-button">Shop to purchase <Icon name="arrow" /></span>
              </button>
              <button className="home-path-card" onClick={onStartBuilder}>
                <span className="landing-feature-icon"><Icon name="layers" /></span>
                <strong>Check the builder</strong>
                <small>Fit pieces on a model, get paired recommendations, output a complete look.</small>
                <span className="text-button">Open outfit builder <Icon name="arrow" /></span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
