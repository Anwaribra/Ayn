import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && process.env.NODE_ENV !== "production") {
  console.warn(
    "Supabase is not configured. OAuth/session sync features are disabled until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
  )
}

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null
