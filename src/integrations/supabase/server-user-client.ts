import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Cria um cliente Supabase server-side atuando como o usuário autenticado (RLS aplica). */
export function createUserClient(accessToken: string) {
  return createClient<Database>(
    process.env.CLIENT_SUPABASE_URL ?? "",
    process.env.CLIENT_SUPABASE_ANON_KEY ?? "",
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}