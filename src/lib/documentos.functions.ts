import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export const TIPOS_DOCUMENTO = ["nota_fiscal", "contrato", "comprovante", "boleto", "outros"] as const;
export const STATUS_DOCUMENTO = [
  "pendente",
  "em_processamento",
  "concluido",
  "rejeitado",
  "arquivado",
] as const;

async function getMinhaEmpresaId(supabase: AnyClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("perfis").select("empresa_id").eq("id", userId).maybeSingle();
  return (data?.empresa_id as string) ?? null;
}

const filtroSchema = z.object({
  tipo: z.enum(TIPOS_DOCUMENTO).optional(),
  status: z.enum(STATUS_DOCUMENTO).optional(),
  cliente_id: z.string().uuid().optional(),
  busca: z.string().optional(),
});

export const listarDocumentos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => filtroSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) return [];
    let q = supabase
      .from("documentos")
      .select("*, clientes:cliente_id (id, nome)")
      .eq("empresa_id", empresaId)
      .order("criado_em", { ascending: false });
    if (data.tipo) q = q.eq("tipo", data.tipo);
    if (data.status) q = q.eq("status", data.status);
    if (data.cliente_id) q = q.eq("cliente_id", data.cliente_id);
    if (data.busca) q = q.ilike("titulo", `%${data.busca}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().trim().min(2).max(200),
  tipo: z.enum(TIPOS_DOCUMENTO),
  status: z.enum(STATUS_DOCUMENTO).default("pendente"),
  cliente_id: z.string().uuid().nullable().optional(),
  url_arquivo: z.string().trim().url().max(2000).nullable().optional().or(z.literal("")),
  valor: z
    .union([z.number().nonnegative(), z.string()])
    .nullable()
    .optional()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }),
  data_emissao: z.string().nullable().optional().or(z.literal("")),
  data_vencimento: z.string().nullable().optional().or(z.literal("")),
  emissor_documento: z.string().max(200).nullable().optional().or(z.literal("")),
  observacoes: z.string().max(2000).nullable().optional().or(z.literal("")),
});

export const upsertDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) throw new Error("Perfil sem empresa vinculada");
    const payload = {
      empresa_id: empresaId,
      titulo: data.titulo,
      tipo: data.tipo,
      status: data.status,
      cliente_id: data.cliente_id || null,
      url_arquivo: data.url_arquivo || null,
      valor: data.valor,
      data_emissao: data.data_emissao || null,
      data_vencimento: data.data_vencimento || null,
      emissor_documento: data.emissor_documento || null,
      observacoes: data.observacoes || null,
    };
    if (data.id) {
      const { error } = await supabase
        .from("documentos")
        .update(payload)
        .eq("id", data.id)
        .eq("empresa_id", empresaId);
      if (error) throw new Error(error.message);
      await fireWebhook(supabase, empresaId, "documento.atualizado", data.id);
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await supabase
      .from("documentos")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const newId = inserted?.id as string;
    await fireWebhook(supabase, empresaId, "documento.criado", newId);
    return { ok: true, id: newId };
  });

async function fireWebhook(
  supabase: AnyClient,
  empresaId: string,
  evento: string,
  documentoId: string,
): Promise<void> {
  const { data: hook } = await supabase
    .from("webhooks_empresa")
    .select("url, secret, ativo, eventos")
    .eq("empresa_id", empresaId)
    .maybeSingle();
  if (!hook || !hook.ativo) return;
  if (Array.isArray(hook.eventos) && !hook.eventos.includes(evento)) return;
  try {
    const { dispatchWebhook } = await import("./webhooks.server");
    await dispatchWebhook(hook.url, hook.secret, {
      evento,
      empresa_id: empresaId,
      documento_id: documentoId,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[webhook] falha silenciosa:", e);
  }
}

export const deletarDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) throw new Error("Perfil sem empresa vinculada");
    const { error } = await supabase
      .from("documentos")
      .delete()
      .eq("id", data.id)
      .eq("empresa_id", empresaId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });