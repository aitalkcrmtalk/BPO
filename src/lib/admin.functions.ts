import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function assertSuperAdmin(supabase: AnyClient, userId: string) {
  const { data } = await supabase.rpc("has_platform_role", { _user_id: userId, _role: "super_admin" });
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const listAllEmpresas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    const { data, error } = await admin
      .from("empresas")
      .select("*")
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    const [ativas, inativas, perfis, documentos] = await Promise.all([
      admin.from("empresas").select("id", { count: "exact", head: true }).eq("ativo", true),
      admin.from("empresas").select("id", { count: "exact", head: true }).eq("ativo", false),
      admin.from("perfis").select("id", { count: "exact", head: true }),
      admin.from("documentos").select("id", { count: "exact", head: true }),
    ]);
    return {
      empresasAtivas: ativas.count ?? 0,
      empresasInativas: inativas.count ?? 0,
      totalPerfis: perfis.count ?? 0,
      totalDocumentos: documentos.count ?? 0,
    };
  });

export const setEmpresaAtivo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ empresa_id: z.string().uuid(), ativo: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    const { error } = await admin
      .from("empresas")
      .update({ ativo: data.ativo, atualizado_em: new Date().toISOString() })
      .eq("id", data.empresa_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });