import { useRef, useState } from "react"
import ExperienceLanding from "@/components/ExperienceLanding"
import { Icon } from "@/components/Icon"
import { initials } from "@/lib/session"

type SectionId = "home" | "about" | "team" | "links"

type Props = {
  /** Open the outfit builder. */
  onStartBuilder: () => void
}

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "team", label: "Team" },
  { id: "links", label: "Links" },
]

const ABOUT: { title: string; body: string }[] = [
  {
    title: "The system",
    body: "Forma is an AI-assisted fashion platform. Customers start with one piece they love; the outfit builder completes the look from the real catalogue — by style, occasion, palette and in-stock availability. A virtual fitting studio previews the outfit on an uploaded model photo, and an AI stylist answers styling questions. Merchants connect their catalogue through CSV or API import, with AI photo classification filling in product attributes.",
  },
  {
    title: "The problem",
    body: "Building a complete look online is fragmented. Shoppers browse pieces in isolation, struggle to picture how items work together, and second-guess fit and style — driving abandoned carts and returns. Small merchants lack the tools to merchandise their catalogue as outfits or to show how their pieces combine.",
  },
  {
    title: "The solution",
    body: "Forma turns one piece into a whole look. The builder recommends compatible, in-stock pieces around the customer's starting choice; the fitting studio and photo stylist use AI to preview the result before buying. For merchants, one pipeline — import, classify, manage — keeps every recommendation grounded in what is actually available.",
  },
]

const TEAM: { name?: string; role?: string }[] = [{}, {}, {}, {}, {}]

const LINKS: { label: string; href?: string }[] = [
  { label: "GitHub" },
  { label: "Live demo" },
  { label: "Presentation" },
]

export default function ProjectLanding({ onStartBuilder }: Props) {
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    home: null,
    about: null,
    team: null,
    links: null,
  })
  const [active, setActive] = useState<SectionId>("home")

  const goToSection = (id: SectionId) => {
    setActive(id)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    sectionRefs.current[id]?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    })
  }

  return (
    <>
      <nav className="landing-section-nav" aria-label="Landing sections">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={id === active ? "active" : undefined}
            aria-current={id === active ? "true" : undefined}
            onClick={() => goToSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section
        id="home"
        className="landing-section"
        aria-label="Home"
        ref={(el) => {
          sectionRefs.current.home = el
        }}
      >
        <ExperienceLanding audience="customer" Icon={Icon} onPrimary={onStartBuilder} />
      </section>

      <section
        id="about"
        className="landing-section"
        aria-labelledby="landing-about-title"
        ref={(el) => {
          sectionRefs.current.about = el
        }}
      >
        <div className="landing-section-heading">
          <span className="eyebrow">ABOUT</span>
          <h2 id="landing-about-title">About Forma</h2>
        </div>
        <div className="landing-about-grid">
          {ABOUT.map((card) => (
            <article key={card.title} className="landing-info-card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="team"
        className="landing-section"
        aria-labelledby="landing-team-title"
        ref={(el) => {
          sectionRefs.current.team = el
        }}
      >
        <div className="landing-section-heading">
          <span className="eyebrow">TEAM</span>
          <h2 id="landing-team-title">Meet the team</h2>
        </div>
        <div className="landing-team-grid">
          {TEAM.map((member, index) => (
            <article key={index} className="landing-placeholder-card landing-team-card">
              <span className="landing-avatar" aria-hidden="true">
                {member.name ? initials(member.name) : "—"}
              </span>
              <strong>{member.name ?? "Name coming soon"}</strong>
              <small>{member.role ?? "Role TBD"}</small>
            </article>
          ))}
        </div>
      </section>

      <section
        id="links"
        className="landing-section"
        aria-labelledby="landing-links-title"
        ref={(el) => {
          sectionRefs.current.links = el
        }}
      >
        <div className="landing-section-heading">
          <span className="eyebrow">LINKS</span>
          <h2 id="landing-links-title">Project links</h2>
        </div>
        <div className="landing-links-grid">
          {LINKS.map((link) =>
            link.href ? (
              <a
                key={link.label}
                className="landing-link-card"
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className="landing-link-icon"><Icon name="link" /></span>
                <strong>{link.label}</strong>
                <small>Open link</small>
              </a>
            ) : (
              <div key={link.label} className="landing-placeholder-card" aria-disabled="true">
                <span className="landing-link-icon"><Icon name="link" /></span>
                <strong>{link.label}</strong>
                <small>Coming soon</small>
              </div>
            )
          )}
        </div>
      </section>
    </>
  )
}
