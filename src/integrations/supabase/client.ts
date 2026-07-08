import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url =
  import.meta.env.VITE_SUPABASE_URL ??
  (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);

if (!url || !key) {
  // Não estoura no build; server functions/telas de erro tratam a ausência.
  console.warn("[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY não configurados.");
}

export const supabase = createClient<Database>(url ?? "https://placeholder.supabase.co", key ?? "placeholder", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "projeto-bpo-auth",
  },
});