import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Cria um cliente Supabase server-side atuando como o usuário autenticado (RLS aplica). */
export function createUserClient(accessToken: string) {
  return createClient<Database>(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "",
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}