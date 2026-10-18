import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { Product } from "@/lib/catalogue"
import { Button, Heading, Input } from "@/components/ui"
import { Garment, Icon } from "@/components/Icon"
import ProductImage from "@/components/ProductImage"
import { recommendFromConversation } from "@/lib/conversationalStylist"
import type { ChatMessage } from "@/lib/conversationalStylist"
import { isConversationConfigured } from "@/lib/aiConfig"
import type { RecommendedItem } from "@/lib/recommendation"

export type AssistantActions = {
  addToOutfit: (product: Product) => void
  addToCart: (product: Product) => void
}

type ChatEntry = {
  id: string
  role: "user" | "assistant"
  content: string
  items?: RecommendedItem[]
}

type Props = {
  products: Product[]
  actions?: AssistantActions | null
  onOpenShop?: () => void
  notify?: (message: string) => void
}

const GREETING: ChatEntry = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi! Tell me the occasion or the vibe and I'll put together a look from what's in stock.",
}

const QUICK_PROMPTS = [
  "Clean fit for a birthday",
  "Something for work",
  "Weekend casual",
  "A night out",
]

const money = (amount: number) =>
  `\u20b1${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`

function toProduct(item: RecommendedItem): Product {
  return {
    sku: item.sku,
    name: item.name,
    category: item.category,
    price: item.price,
    stock: item.stock,
    color: item.color,
    imageUrl: item.imageUrl,
  }
}

export default function StylistChat({
  products,
  actions,
  onOpenShop,
  notify,
}: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<ChatEntry[]>([GREETING])
  const configured = isConversationConfigured()
  const launcher = useRef<HTMLButtonElement | null>(null)
  const log = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    if (open) log.current?.scrollTo({ top: log.current.scrollHeight })
  }, [messages, open, sending])

  const close = () => {
    setOpen(false)
    if (launcher.current?.isConnected) launcher.current.focus()
  }

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || sending) return
    const userEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    }
    const history: ChatMessage[] = [...messages, userEntry]
      .filter((entry) => entry.content)
      .map((entry) => ({ role: entry.role, content: entry.content }))
    setMessages((current) => [...current, userEntry])
    setInput("")
    setError("")
    setSending(true)
    try {
      const result = await recommendFromConversation(products, history)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            result.message ||
            (result.items.length
              ? "Here are some pieces from the catalogue."
              : "I could not find anything in stock that fits that request."),
          items: result.items,
        },
      ])
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The stylist could not respond. Please try again.",
      )
    } finally {
      setSending(false)
    }
  }

  const showPrompts = configured && messages.length === 1 && !sending

  const renderItems = (items: RecommendedItem[]) => (
    <div className="stylist-cards">
      {items.map((item) => {
        const product = toProduct(item)
        return (
          <article className="stylist-card" key={item.sku}>
            <div className="stylist-card-media">
              <ProductImage product={product} Garment={Garment} />
            </div>
            <div className="stylist-card-body">
              <strong>{item.name}</strong>
              <small>
                {item.category} · Size {item.size}
              </small>
              <span className="stylist-card-meta">
                <span className="stylist-card-price">{money(item.price)}</span>
                <span className="stylist-stock">
                  <i aria-hidden="true" />
                  {item.stock} in stock
                </span>
              </span>
              <div className="stylist-card-actions">
                {actions ? (
                  <>
                    <Button
                      className="button primary stylist-card-add"
                      onClick={() => {
                        actions.addToOutfit(product)
                        notify?.(`${item.name} added to your outfit.`)
                      }}
                    >
                      <Icon name="plus" />
                      Add to outfit
                    </Button>
                    <Button
                      className="button secondary stylist-card-add"
                      onClick={() => {
                        actions.addToCart(product)
                      }}
                    >
                      <Icon name="bag" />
                      Cart
                    </Button>
                  </>
                ) : onOpenShop ? (
                  <Button className="button secondary stylist-card-add" onClick={onOpenShop}>
                    Open the shop
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )

  return (
    <>
      <button
        type="button"
        ref={launcher}
        className="stylist-launcher"
        aria-label="Ask Forma - open the stylist"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="sparkle" />
        <span>Ask Forma</span>
      </button>
      {open &&
        createPortal(
          <div className="stylist-overlay" role="presentation" onMouseDown={close}>
            <section
              className="stylist-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Forma stylist"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="stylist-header">
                <span className="stylist-mark" aria-hidden="true">
                  f.
                </span>
                <div className="stylist-heading">
                  <Heading level={2}>Forma stylist</Heading>
                  <p>Grounded on your catalogue · in stock only</p>
                </div>
                <Button
                  className="icon-button stylist-close"
                  aria-label="Close the stylist"
                  onClick={close}
                >
                  <Icon name="close" />
                </Button>
              </header>
              <div className="stylist-log" ref={log} aria-live="polite">
                {messages.map((entry) => (
                  <div
                    key={entry.id}
                    className={`stylist-message stylist-${entry.role}`}
                  >
                    <p>{entry.content}</p>
                    {entry.items?.length ? renderItems(entry.items) : null}
                  </div>
                ))}
                {showPrompts && (
                  <div className="stylist-chips" aria-label="Suggested prompts">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="stylist-chip"
                        onClick={() => void send(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                {sending && (
                  <div className="stylist-message stylist-assistant stylist-typing">
                    <span className="stylist-dots" aria-label="Styling…">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                )}
                {error && (
                  <div className="stylist-error" role="alert">
                    {error}
                  </div>
                )}
              </div>
              <form
                className="stylist-compose"
                onSubmit={(event) => {
                  event.preventDefault()
                  void send()
                }}
              >
                <Input
                  ref={inputRef}
                  aria-label="Message the stylist"
                  placeholder={
                    configured
                      ? "Ask for a fit…"
                      : "Add VITE_GEMINI_API_KEY to chat"
                  }
                  value={input}
                  disabled={!configured || sending}
                  maxLength={500}
                  onChange={(event) => setInput(event.target.value)}
                />
                <Button
                  type="submit"
                  className="stylist-send"
                  aria-label="Send message"
                  disabled={!configured || sending || !input.trim()}
                >
                  <Icon name="arrow" />
                </Button>
              </form>
              <p className="stylist-note">
                Suggestions come only from in-stock catalogue items.
              </p>
            </section>
          </div>,
          document.body,
        )}
    </>
  )
}
