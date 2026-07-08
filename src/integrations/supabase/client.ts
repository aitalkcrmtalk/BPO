import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Config injetada pelo SSR via window.__SUPABASE_CFG__ (ver src/routes/__root.tsx),
// alimentada pelos secrets CLIENT_SUPABASE_URL / CLIENT_SUPABASE_ANON_KEY.
// Em SSR, lê direto de process.env.
type PublicCfg = { url: string; anonKey: string };

function readCfg(): PublicCfg {
  if (typeof window !== "undefined") {
    const w = (window as unknown as { __SUPABASE_CFG__?: PublicCfg }).__SUPABASE_CFG__;
    if (w?.url && w?.anonKey) return w;
  }
  if (typeof process !== "undefined" && process.env) {
    const url = process.env.CLIENT_SUPABASE_URL ?? "";
    const anonKey = process.env.CLIENT_SUPABASE_ANON_KEY ?? "";
    if (url && anonKey) return { url, anonKey };
  }
  return { url: "", anonKey: "" };
}

const { url, anonKey } = readCfg();

if (!url || !anonKey) {
  console.warn("[supabase] CLIENT_SUPABASE_URL / CLIENT_SUPABASE_ANON_KEY não configurados.");
}

export const supabase = createClient<Database>(url || "https://placeholder.supabase.co", anonKey || "placeholder", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "projeto-bpo-auth",
  },
});