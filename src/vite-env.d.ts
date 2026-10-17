/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMD_CLOUD_API_KEY?: string
  readonly VITE_AMD_CLOUD_BASE_URL?: string
  readonly VITE_AMD_CLOUD_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
