import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getMinhaEmpresaId(supabase: AnyClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("perfis").select("empresa_id").eq("usuario_id", userId).maybeSingle();
  return (data?.empresa_id as string) ?? null;
}

export const listMeusClientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) return [];
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const criarCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        nome: z.string().min(2),
        cnpj: z.string().optional().default(""),
        url_pasta_drive: z.string().url().optional().or(z.literal("")).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) throw new Error("Perfil sem empresa vinculada");
    const { error } = await supabase.from("clientes").insert({
      empresa_id: empresaId,
      nome: data.nome,
      cnpj: data.cnpj || null,
      url_pasta_drive: data.url_pasta_drive || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMeusPerfis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) return [];
    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMeusDocumentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) return [];
    const { data, error } = await supabase
      .from("documentos")
      .select("*, clientes:cliente_id (id, nome)")
      .eq("empresa_id", empresaId)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });