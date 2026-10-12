import "server-only";

import { createClient } from "@supabase/supabase-js";
import { ServiceError } from "./errors";

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new ServiceError("Supabase is not configured.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
