/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production'
  readonly VITE_INCLUDE_DEV_LESSON_COURSES?: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_REDIRECT_URL?: string
  readonly VITE_API_URL?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  /** App Store Connect のキャンペーン用プロバイダトークン（pt）。未設定でも ct+mt は付与される。 */
  readonly VITE_APP_STORE_PROVIDER_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}