import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Cliente admin (service role) — SOMENTE server-side.
// Nunca importar em componentes ou em *.functions.ts no topo do módulo.
// Uso: `const { supabaseAdmin } = await import("@/integrations/supabase/client.server")`
// dentro do handler de uma server function.
export const supabaseAdmin = createClient<Database>(
  process.env.CLIENT_SUPABASE_URL ?? "",
  process.env.CLIENT_SUPABASE_SERVICE_ROLE_KEY ?? "",
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);