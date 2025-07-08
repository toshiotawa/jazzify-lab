import { createClient } from '@supabase/supabase-js'

// 環境に応じてSupabase設定を切り替え
const getSupabaseConfig = () => {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'local'
  const isProduction = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production'
  
  // 本番環境（Netlifyなど）の場合
  if (isProduction || environment === 'production') {
    return {
      url: import.meta.env.VITE_SUPABASE_URL_PROD || import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_PROD || import.meta.env.VITE_SUPABASE_ANON_KEY
    }
  }
  
  // ローカル開発環境の場合
  return {
    url: import.meta.env.VITE_SUPABASE_URL_LOCAL || import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_LOCAL || import.meta.env.VITE_SUPABASE_ANON_KEY
  }
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig()

if (!supabaseUrl || !supabaseAnonKey) {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'local'
  const isProduction = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production'
  
  throw new Error(
    `Supabase URL and anonymous key are required for environment: ${isProduction ? 'production' : environment}. ` +
    `Please set ${isProduction ? 'VITE_SUPABASE_URL_PROD and VITE_SUPABASE_ANON_KEY_PROD' : 'VITE_SUPABASE_URL_LOCAL and VITE_SUPABASE_ANON_KEY_LOCAL'} in your environment variables.`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          member_rank: string
          total_exp: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          member_rank?: string
          total_exp?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          member_rank?: string
          total_exp?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}