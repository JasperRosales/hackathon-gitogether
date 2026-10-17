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

type ChatCompletionPayload = {
  choices?: { message?: { content?: string } }[]
  error?: { message?: string }
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
  try {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
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
    const payload = (await response
      .json()
      .catch(() => null)) as ChatCompletionPayload | null
    if (!response.ok)
      throw new RecommendationError(
        "http",
        payload?.error?.message ||
          `AI endpoint returned HTTP ${response.status}.`,
      )
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
