import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

/** Null when the env vars are missing — the app still runs, purely offline. */
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null

export const cloudEnabled = Boolean(supabase)
