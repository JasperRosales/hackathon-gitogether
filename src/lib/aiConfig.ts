import { RecommendationError } from "./recommendation"

export type AiProviderConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

export const DEFAULT_GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai"
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

function trim(value: string | undefined, fallback = ""): string {
  return (value || "").trim() || fallback
}

function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  return trim(value, fallback).replace(/\/+$/, "")
}

export function readVisionConfig(
  env: ImportMetaEnv = import.meta.env,
): AiProviderConfig {
  return {
    apiKey: trim(env.VITE_AMD_CLOUD_API_KEY),
    baseUrl: normalizeBaseUrl(env.VITE_AMD_CLOUD_BASE_URL, ""),
    model: trim(env.VITE_AMD_CLOUD_VISION_MODEL),
  }
}

export function readConversationConfig(
  env: ImportMetaEnv = import.meta.env,
): AiProviderConfig {
  return {
    apiKey: trim(env.VITE_GEMINI_API_KEY),
    baseUrl: normalizeBaseUrl(env.VITE_GEMINI_BASE_URL, DEFAULT_GEMINI_BASE_URL),
    model: trim(env.VITE_GEMINI_MODEL, DEFAULT_GEMINI_MODEL),
  }
}

export function isVisionConfigured(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  const config = readVisionConfig(env)
  return Boolean(config.apiKey && config.baseUrl && config.model)
}

export function isConversationConfigured(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  const config = readConversationConfig(env)
  return Boolean(config.apiKey && config.baseUrl && config.model)
}

export function assertVisionConfigured(config: AiProviderConfig): void {
  if (!config.apiKey)
    throw new RecommendationError(
      "config",
      "Vision API key is missing. Set VITE_AMD_CLOUD_API_KEY before analysing a photo.",
    )
  if (!config.baseUrl)
    throw new RecommendationError(
      "config",
      "Vision base URL is missing. Set VITE_AMD_CLOUD_BASE_URL to the OpenAI-compatible endpoint.",
    )
  if (!config.model)
    throw new RecommendationError(
      "config",
      "Vision model is missing. Set VITE_AMD_CLOUD_VISION_MODEL before analysing a photo.",
    )
}

export function assertConversationConfigured(config: AiProviderConfig): void {
  if (!config.apiKey)
    throw new RecommendationError(
      "config",
      "Gemini API key is missing. Set VITE_GEMINI_API_KEY before recommending.",
    )
  if (!config.baseUrl)
    throw new RecommendationError(
      "config",
      "Gemini base URL is missing. Set VITE_GEMINI_BASE_URL.",
    )
  if (!config.model)
    throw new RecommendationError(
      "config",
      "Gemini model is missing. Set VITE_GEMINI_MODEL.",
    )
}
