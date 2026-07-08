import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getMinhaEmpresaId(supabase: AnyClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("perfis").select("empresa_id").eq("id", userId).maybeSingle();
  return (data?.empresa_id as string) ?? null;
}

export const getMeuWebhook = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) return null;
    const { data } = await supabase
      .from("webhooks_empresa")
      .select("*")
      .eq("empresa_id", empresaId)
      .maybeSingle();
    return data ?? null;
  });

const upsertSchema = z.object({
  url: z.string().url().max(500),
  secret: z.string().min(16).max(200),
  ativo: z.boolean().default(true),
  eventos: z.array(z.string()).min(1).default(["documento.criado", "documento.atualizado"]),
});

export const upsertMeuWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) throw new Error("Sem empresa");
    const { error } = await supabase.from("webhooks_empresa").upsert(
      {
        empresa_id: empresaId,
        url: data.url,
        secret: data.secret,
        ativo: data.ativo,
        eventos: data.eventos,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "empresa_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletarMeuWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) return { ok: true };
    await supabase.from("webhooks_empresa").delete().eq("empresa_id", empresaId);
    return { ok: true };
  });

/** Testa disparo (envia payload dummy assinado). */
export const testarWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) throw new Error("Sem empresa");
    const { data: hook } = await supabase
      .from("webhooks_empresa")
      .select("url, secret")
      .eq("empresa_id", empresaId)
      .maybeSingle();
    if (!hook) throw new Error("Nenhum webhook configurado");
    const { dispatchWebhook } = await import("./webhooks.server");
    const status = await dispatchWebhook(hook.url, hook.secret, {
      evento: "webhook.teste",
      empresa_id: empresaId,
      timestamp: new Date().toISOString(),
      teste: true,
    });
    return { status };
  });