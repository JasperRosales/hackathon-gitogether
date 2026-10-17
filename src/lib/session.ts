export type Session = {
  name: string
  email: string
  role: "customer" | "merchant"
}

export const sessionKey = "forma-demo-session"

export function readSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(sessionKey) || "null")
    return value &&
      typeof value.name === "string" &&
      value.name.trim() &&
      typeof value.email === "string" &&
      ["customer", "merchant"].includes(value.role)
      ? value
      : null
  } catch {
    return null
  }
}

export function storeSession(session: Session) {
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify(session))
  } catch {
    /* Session remains usable in memory when storage is blocked. */
  }
}

export function clearStoredSession() {
  try {
    sessionStorage.removeItem(sessionKey)
  } catch {
    /* Clear the in-memory session regardless. */
  }
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
