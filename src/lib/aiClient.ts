import { RecommendationError } from "./recommendation"

export type AiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

export type AiChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "user"; content: AiContentPart[] }

export type AiClientConfig = { apiKey: string; baseUrl: string }

export type ChatOptions = {
  model: string
  messages: AiChatMessage[]
  json?: boolean
  temperature?: number
  timeoutMs?: number
  signal?: AbortSignal
  config: AiClientConfig
  fetchImpl?: typeof fetch
}

export const DEFAULT_TIMEOUT_MS = 30000

const RETRY_STATUSES = [429, 502, 503]
const MAX_RETRIES = 2
const MAX_AUTO_RETRY_DELAY_MS = 8000

type ChatCompletionPayload = {
  choices?: { message?: { content?: string } }[]
  error?: { message?: string }
}

function retryAfterMs(response: Response): number | null {
  const header = response.headers?.get?.("retry-after")
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const date = Date.parse(header)
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now())
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

export async function chat(options: ChatOptions): Promise<string> {
  const config: AiClientConfig = options.config
  if (!config || !config.apiKey || !config.baseUrl)
    throw new RecommendationError(
      "config",
      "AI endpoint is not configured. Set VITE_AMD_CLOUD_API_KEY and VITE_AMD_CLOUD_BASE_URL.",
    )
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (options.signal?.aborted) controller.abort()
  options.signal?.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const fetchImpl = options.fetchImpl ?? fetch
  const request = () =>
    fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    })
  try {
    let response = await request()
    // AMD honours Retry-After; only 429/502/503 are retryable. A long
    // Retry-After (per-minute limit) is surfaced to the caller instead.
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (!RETRY_STATUSES.includes(response.status)) break
      const hinted = retryAfterMs(response)
      if (hinted !== null && hinted > MAX_AUTO_RETRY_DELAY_MS) break
      const backoff = 1000 * 2 ** attempt + Math.random() * 250
      await sleep(Math.min(hinted ?? backoff, MAX_AUTO_RETRY_DELAY_MS), controller.signal)
      if (controller.signal.aborted) break
      response = await request()
    }
    if (controller.signal.aborted)
      throw new RecommendationError(
        "timeout",
        options.signal?.aborted
          ? "Request cancelled."
          : `AI request timed out after ${timeoutMs / 1000} seconds.`,
      )
    const payload = (await response
      .json()
      .catch(() => null)) as ChatCompletionPayload | null
    if (!response.ok) {
      if (response.status === 429) {
        const hinted = retryAfterMs(response)
        throw new RecommendationError(
          "http",
          `Rate limited by the AI provider${
            hinted ? `; try again in about ${Math.ceil(hinted / 1000)}s` : ""
          }. The API key is shared, so requests are throttled.`,
        )
      }
      throw new RecommendationError(
        "http",
        payload?.error?.message ||
          `AI endpoint returned HTTP ${response.status}.`,
      )
    }
    const content = payload?.choices?.[0]?.message?.content
    if (typeof content !== "string" || !content.trim())
      throw new RecommendationError(
        "parse",
        "AI endpoint returned an empty completion.",
      )
    return content
  } catch (error) {
    if (error instanceof RecommendationError) throw error
    if (controller.signal.aborted)
      throw new RecommendationError(
        "timeout",
        options.signal?.aborted
          ? "Request cancelled."
          : `AI request timed out after ${timeoutMs / 1000} seconds.`,
      )
    if (error instanceof TypeError)
      throw new RecommendationError(
        "network",
        "Cannot reach the AI endpoint. Check VITE_AMD_CLOUD_BASE_URL and that it allows browser requests (CORS).",
      )
    throw new RecommendationError(
      "http",
      error instanceof Error ? error.message : "AI request failed.",
    )
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener("abort", abort)
  }
}

export function parseJsonContent(content: string): unknown {
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    throw new RecommendationError("parse", "AI response was not valid JSON.")
  }
}
