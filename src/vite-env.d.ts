/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMD_CLOUD_API_KEY?: string
  readonly VITE_AMD_CLOUD_BASE_URL?: string
  readonly VITE_AMD_CLOUD_MODEL?: string
  readonly VITE_AMD_CLOUD_VISION_MODEL?: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GEMINI_BASE_URL?: string
  readonly VITE_GEMINI_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
