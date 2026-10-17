import { useState } from "react"
import { Button, Input, Heading, Form } from "@/components/ui"
import { Icon, Garment } from "@/components/Icon"
import Footer from "@/components/Footer"
import type { Session } from "@/lib/session"

export default function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [role, setRole] = useState<"customer" | "merchant">("customer")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [googleLoading, setGoogleLoading] = useState(false)
  const continueWithGoogle = () => {
    setError("")
    setGoogleLoading(true)
    // Demo stand-in for Google Identity Services: no real OAuth client here,
    // so simulate the redirect back with a Google-style profile.
    setTimeout(() => {
      setGoogleLoading(false)
      onLogin({
        name: "Google User",
        email: "google.user@gmail.com",
        role,
      })
    }, 900)
  }
  return (
    <div className="login-page">
      <header className="login-header">
        <div className="atelier-wordmark">Forma</div>
      </header>
      <main className="login-layout">
        <section className="login-story">
          <Heading level={1}>
            A better fit.
            <br />
            <span>For everyone.</span>
          </Heading>
          <div className="login-garments" aria-hidden="true">
            <Garment type="Top" />
            <Garment type="Bottom" />
            <Garment type="Footwear" />
          </div>
        </section>
        <section className="login-card" aria-label="Log in">
          <Heading level={2}>Welcome back.</Heading>
          <div className="look-tabs login-role" aria-label="Account type">
            {(["customer", "merchant"] as const).map((value) => (
              <Button
                key={value}
                aria-pressed={role === value}
                className={role === value ? "selected" : ""}
                onClick={() => {
                  setRole(value)
                  setError("")
                }}
              >
                {value === "customer" ? "Customer" : "Merchant"}
              </Button>
            ))}
          </div>
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              const account = identifier.trim()
              const isEmail = account.includes("@")
              if (!account) {
                setError("Enter your email address or username.")
                return
              }
              if (
                isEmail
                  ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)
                  : !/^[a-zA-Z0-9._-]{3,80}$/.test(account)
              ) {
                setError(
                  "Enter a valid email or a username of 3–80 letters, numbers, dots, underscores or hyphens.",
                )
                return
              }
              if (password !== "forma-demo") {
                setError(
                  'This demo uses the password "forma-demo". Do not use a real password.',
                )
                setPassword("")
                return
              }
              setPassword("")
              onLogin({
                name: isEmail ? account.split("@")[0] : account,
                email: isEmail ? account : "",
                role,
              })
            }}
          >
            <label htmlFor="login-identifier">Email address or username</label>
            <Input
              id="login-identifier"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              maxLength={254}
              required
              onChange={(e) => {
                setIdentifier(e.target.value)
                setError("")
              }}
              placeholder="you@example.com or username"
            />
            <label htmlFor="login-password">Password</label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-describedby="login-demo-help"
              value={password}
              required
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              placeholder="Enter password"
            />
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="button primary full">
              Log in as {role}
              <Icon name="arrow" />
            </Button>
          </Form>
          <div className="login-divider" aria-hidden="true">
            <span>or</span>
          </div>
          <Button
            className="button secondary full"
            disabled={googleLoading}
            onClick={continueWithGoogle}
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.4 7.5 24 12 24z" />
              <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.5-2.7-.1.1C.6 8.6 0 10.2 0 12s.6 3.4 1.5 4.9l3.7-2.5z" />
              <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.6 1.5 6.9l3.7 2.9c.9-2.9 3.6-5.1 6.8-5.1z" />
            </svg>
            {googleLoading ? "Connecting to Google…" : "Continue with Google"}
          </Button>
          <div className="login-demo-note" id="login-demo-help">
            <strong>Demo login only.</strong>
            <p>
              Use a sample email or username and password{" "}
              <strong>forma-demo</strong>. Passwords are never stored or sent.
              This local demo is not secure authentication; do not enter real
              credentials.
            </p>
          </div>
        </section>
      </main>
      <Footer
        className="login-footer"
        note="Local demo only. Passwords are never stored or transmitted."
      />
    </div>
  )
}
