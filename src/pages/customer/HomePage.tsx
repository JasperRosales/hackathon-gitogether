import { Button, Heading } from "@/components/ui"
import { Icon } from "@/components/Icon"
import ExperienceLanding from "@/components/ExperienceLanding"
import { classificationCategories } from "@/lib/classification"

type Props = {
  image: string
  category: string
  setCategory: (category: string) => void
  /** Open the outfit builder. */
  onStartBuilder: () => void
}

export default function HomePage({
  image,
  category,
  setCategory,
  onStartBuilder,
}: Props) {
  return (
    <>
      <ExperienceLanding
        audience="customer"
        image={image}
        Icon={Icon}
        onPrimary={onStartBuilder}
      />
      <section className="home-entry" aria-label="Start your flow">
        <div className="home-entry-heading">
          <Heading level={2}>Start your flow</Heading>
          <p>Pick a category, then open the builder to build your look.</p>
        </div>
        <div className="home-entry-steps">
          <div className="home-step">
            <span className="home-step-number" aria-hidden="true">1</span>
            <div>
              <strong>Choose a clothing category</strong>
              <div className="shop-categories home-categories" aria-label="Choose a category">
                {["All", ...classificationCategories].map((c) => (
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
              <button className="home-path-card" onClick={onStartBuilder}>
                <span className="landing-feature-icon"><Icon name="layers" /></span>
                <strong>Open the outfit builder</strong>
                <small>Choose a model, try pieces on, and let the builder recommend a complete look.</small>
                <span className="text-button">Open outfit builder <Icon name="arrow" /></span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
