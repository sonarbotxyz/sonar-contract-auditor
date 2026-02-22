import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    // Return a dummy client that won't throw at import time.
    // Operations will fail gracefully at runtime.
    _supabase = createClient("https://placeholder.supabase.co", "placeholder");
  } else {
    _supabase = createClient(url, key);
  }

  return _supabase;
}
