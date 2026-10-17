import { useRef } from "react"
import type { ComponentType } from "react"
import {
  motion,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardDescription, CardTitle } from "./ui/card"
import model1 from "@/assets/model1.jpg"
import model2 from "@/assets/model2.jpg"
import model3 from "@/assets/model3.jpg"
import model4 from "@/assets/model4.jpg"

type Props = {
  audience: "customer" | "merchant"
  image?: string
  productCount?: number
  source?: string
  Icon: ComponentType<{ name: string }>
  onPrimary: () => void
  onSecondary?: () => void
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const heroParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
}

const lineMask: Variants = {
  hidden: { y: "115%" },
  show: { y: "0%", transition: { duration: 0.9, ease: EASE } },
}

const tileIn: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, delay: (i % 3) * 0.1, ease: EASE },
  }),
}

const cardHover = {
  rest: { y: 0 },
  hover: { y: -6, transition: { type: "spring" as const, stiffness: 320, damping: 22 } },
}

const iconHover: Variants = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: -8, scale: 1.08, transition: { type: "spring" as const, stiffness: 400, damping: 15 } },
}

const springTap = { type: "spring" as const, stiffness: 500, damping: 28 }

export default function ExperienceLanding({
  audience,
  image,
  productCount = 0,
  source,
  Icon,
  onPrimary,
  onSecondary,
}: Props) {
  const merchant = audience === "merchant"
  const reduce = useReducedMotion()

  const mosaicRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: mosaicRef,
    offset: ["start end", "end start"],
  })
  const drift = (from: number, to: number) =>
    useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [from, to])
  const yLeft = drift(40, -40)
  const yMid = drift(80, -40)
  const yRight = drift(40, -80)

  const features: Array<[string, string, string]> = merchant
    ? [
        ["link", "Your catalogue, connected", "Import a CSV or connect an inventory API. Products, prices and size-level stock feed the customer builder."],
        ["layers", "Understand the outfit", "Explore combinations, swap patterns and in-stock promotion candidates."],
        ["bag", "Keep business in view", "A focused overview for assisted sales, engagement and products that need attention."],
      ]
    : [
        ["catalogue", "Start with a piece", "Discover the collection and keep the pieces you love at the heart of your look."],
        ["layers", "Make it an outfit", "Find complementary pieces matched to your style, occasion, size and budget."],
        ["check", "Review your fit", "Explore one piece or a complete bundle in the fitting studio before adding it to your cart."],
      ]

  const primary = () => {
    onPrimary()
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="experience-landing">
        {/* Centered hero — choreographed mask + blur reveal */}
        <motion.section
          className="landing-hero-centered"
          variants={heroParent}
          initial="hidden"
          animate="show"
        >
          <div className="landing-copy-centered">
            <motion.span variants={rise} className="eyebrow">
              {merchant ? "FORMA FOR RETAILERS" : "A MORE PERSONAL WAY TO SHOP"}
            </motion.span>
            <h1 aria-label={merchant ? "Your inventory. More possibilities." : "One piece. Your whole look."}>
              <span className="mask" aria-hidden="true">
                <motion.span variants={lineMask}>
                  {merchant ? "Your inventory." : "One piece."}
                </motion.span>
              </span>
              <span className="mask" aria-hidden="true">
                <motion.span variants={lineMask}>
                  {merchant ? "More possibilities." : "Your whole look."}
                </motion.span>
              </span>
            </h1>
            <motion.p variants={rise}>
              {merchant
                ? "Connect your store's catalogue, keep stock current, and help customers discover what belongs together."
                : "An outfit starts with you. Choose a piece, explore the possibilities, and build a look that feels like your own."}
            </motion.p>
            <motion.div variants={rise} className="landing-actions-centered">
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={springTap}>
                <Button onClick={primary} className="h-11 px-6">
                  {merchant ? "Configure your store" : "Build my outfit"}
                  <ArrowRight className="size-4" />
                </Button>
              </motion.span>
              {onSecondary && (
                <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={springTap}>
                  <Button onClick={onSecondary} variant="outline" className="h-11 px-6">
                    {merchant ? "Open overview" : "Style a single piece"}
                  </Button>
                </motion.span>
              )}
            </motion.div>
            <motion.span variants={rise} className="landing-caption">
              {merchant
                ? "Read-only connections. Your retailer remains in control."
                : "Start with one piece. The builder recommends the rest."}
            </motion.span>
          </div>
        </motion.section>

        {/* Photo mosaic — staggered parallax columns */}
        <section
          className={merchant ? "landing-mosaic" : "landing-mosaic landing-mosaic-four"}
          aria-label={merchant ? "Store highlights" : "Collection highlights"}
          ref={mosaicRef}
        >
          {merchant ? (
            <>
              <motion.div className="landing-mosaic-side" style={{ y: yLeft }}>
                <motion.div variants={tileIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} custom={0}>
                  <Card className="landing-mosaic-tall landing-store-card">
                    <span className="landing-store-mark">f.</span>
                    <CardTitle>{productCount}{productCount ? " +" : ""}</CardTitle>
                    <CardDescription>Products in catalogue</CardDescription>
                  </Card>
                </motion.div>
              </motion.div>
              <motion.div className="landing-mosaic-mid" style={{ y: yMid }}>
                <motion.div variants={tileIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} custom={1}>
                  <Card className="landing-mosaic-mini">
                    <span className="landing-feature-icon">
                      <Icon name="link" />
                    </span>
                    <CardTitle>Inventory source</CardTitle>
                    <CardDescription>{source}</CardDescription>
                  </Card>
                </motion.div>
                <motion.div variants={tileIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} custom={2}>
                  <Card className="landing-mosaic-mini">
                    <span className="landing-feature-icon">
                      <Icon name="check" />
                    </span>
                    <CardTitle>Connection direction</CardTitle>
                    <CardDescription>Read-only</CardDescription>
                  </Card>
                </motion.div>
              </motion.div>
              <motion.div className="landing-mosaic-side" style={{ y: yRight }}>
                <motion.div variants={tileIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} custom={1}>
                  <Card className="landing-mosaic-tall landing-store-card">
                    <CardTitle>Ready for the next look.</CardTitle>
                    <CardDescription>Manage connections any time.</CardDescription>
                    <Button onClick={primary} variant="secondary" className="mt-6 w-full">
                      Manage connections
                      <ArrowRight className="size-4" />
                    </Button>
                  </Card>
                </motion.div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div className="landing-mosaic-side" style={{ y: yLeft }}>
                <motion.figure
                  variants={tileIn}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  custom={0}
                  className="landing-photo landing-mosaic-tall"
                >
                  <img src={model1} alt="Fashion model wearing a styled outfit" />
                  <span className="landing-photo-label">The look is yours to build.</span>
                </motion.figure>
              </motion.div>
              <motion.div className="landing-mosaic-drop" style={{ y: yMid }}>
                <motion.figure
                  variants={tileIn}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  custom={1}
                  className="landing-photo landing-mosaic-mini-photo"
                >
                  <img
                    src={model2}
                    alt="Collection detail — model wearing a tailored piece"
                  />
                  <span className="landing-photo-label">Start with a piece.</span>
                </motion.figure>
              </motion.div>
              <motion.div className="landing-mosaic-drop" style={{ y: yMid }}>
                <motion.figure
                  variants={tileIn}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  custom={2}
                  className="landing-photo landing-mosaic-mini-photo"
                >
                  <img
                    src={model3}
                    alt="Collection detail — model wearing a complete outfit"
                  />
                  <span className="landing-photo-label">Make it an outfit.</span>
                </motion.figure>
              </motion.div>
              <motion.div className="landing-mosaic-side" style={{ y: yRight }}>
                <motion.figure
                  variants={tileIn}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  custom={1}
                  className="landing-photo landing-mosaic-tall"
                >
                  <img src={model4} alt="Fashion model wearing a styled outfit" />
                  <span className="landing-photo-label">Review your fit.</span>
                  <small>Ola Szkolda / Unsplash</small>
                </motion.figure>
              </motion.div>
            </>
          )}
        </section>

        {/* Feature cards — staggered rise + spring hover */}
        <section className="landing-features-cards" aria-label={merchant ? "Merchant workspace features" : "Shopping features"}>
          {features.map(([icon, title, detail], i) => (
            <motion.div
              key={title}
              variants={tileIn}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              custom={i}
            >
              <motion.div variants={cardHover} initial="rest" whileHover="hover" animate="rest">
                <Card className="landing-feature-card">
                  <div className="landing-feature-top">
                    <motion.span className="landing-feature-icon" variants={iconHover}>
                      <Icon name={icon} />
                    </motion.span>
                    <span className="landing-feature-step" aria-hidden="true">0{i + 1}</span>
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{detail}</CardDescription>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </section>
      </div>
    </MotionConfig>
  )
}
