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
      .order("nome", { ascending: true });
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
    const desde30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [ativas, inativas, perfis, documentos, docs30, mrrRows] = await Promise.all([
      admin.from("empresas").select("id", { count: "exact", head: true }).eq("ativo", true),
      admin.from("empresas").select("id", { count: "exact", head: true }).eq("ativo", false),
      admin.from("perfis").select("id", { count: "exact", head: true }),
      admin.from("documentos").select("id", { count: "exact", head: true }),
      admin
        .from("documentos")
        .select("id", { count: "exact", head: true })
        .gte("criado_em", desde30),
      admin
        .from("assinaturas")
        .select("valor_base, itens_assinatura(modulo_id, ativo, modulos(valor_base))")
        .eq("status", "ativa"),
    ]);

    let mrr = 0;
    for (const a of (mrrRows.data ?? []) as Array<{
      valor_base: number | null;
      itens_assinatura: Array<{ ativo: boolean; modulos: { valor_base: number | null } | null }>;
    }>) {
      mrr += Number(a.valor_base ?? 0);
      for (const it of a.itens_assinatura ?? []) {
        if (it.ativo) mrr += Number(it.modulos?.valor_base ?? 0);
      }
    }

    return {
      empresasAtivas: ativas.count ?? 0,
      empresasInativas: inativas.count ?? 0,
      totalPerfis: perfis.count ?? 0,
      totalDocumentos: documentos.count ?? 0,
      documentos30d: docs30.count ?? 0,
      mrrEstimado: mrr,
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

// ---------------------------------------------------------------------------
// Módulos (catálogo de planos)
// ---------------------------------------------------------------------------
export const listModulos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    const { data, error } = await admin
      .from("modulos")
      .select("*")
      .order("chave", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        chave: z.string().min(2).max(60),
        nome: z.string().min(2).max(120),
        ativo: z.boolean().default(true),
        valor_base: z.number().nonnegative().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    if (data.id) {
      const { error } = await admin
        .from("modulos")
        .update({
          chave: data.chave,
          nome: data.nome,
          ativo: data.ativo,
          valor_base: data.valor_base,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.from("modulos").insert({
        chave: data.chave,
        nome: data.nome,
        ativo: data.ativo,
        valor_base: data.valor_base,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Assinaturas por empresa
// ---------------------------------------------------------------------------
export const getAssinaturaEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ empresa_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    const { data: ass } = await admin
      .from("assinaturas")
      .select("*, itens_assinatura(*, modulos(*))")
      .eq("empresa_id", data.empresa_id)
      .maybeSingle();
    const { data: modulos } = await admin
      .from("modulos")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    return { assinatura: ass, modulosDisponiveis: modulos ?? [] };
  });

export const setAssinaturaStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        empresa_id: z.string().uuid(),
        status: z.enum(["ativa", "suspensa", "cancelada", "trial", "atrasada"]),
        plano: z.string().default("padrao"),
        valor_base: z.number().nonnegative().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    const { error } = await admin.from("assinaturas").upsert(
      {
        empresa_id: data.empresa_id,
        status: data.status,
        plano: data.plano,
        valor_base: data.valor_base,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "empresa_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleItemAssinatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        assinatura_id: z.string().uuid(),
        modulo_id: z.string().uuid(),
        ativo: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    const { error } = await admin.from("itens_assinatura").upsert(
      {
        assinatura_id: data.assinatura_id,
        modulo_id: data.modulo_id,
        ativo: data.ativo,
      },
      { onConflict: "assinatura_id,modulo_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Perfil completo da empresa (super admin visualiza como se estivesse dentro)
// ---------------------------------------------------------------------------
export const getEmpresaDetalhes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ empresa_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;

    const desde30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [empresaRes, assinaturaRes, usuariosRes, clientesCount, docsCount, docs30] =
      await Promise.all([
        admin.from("empresas").select("*").eq("id", data.empresa_id).maybeSingle(),
        admin
          .from("assinaturas")
          .select("*, itens_assinatura(*, modulos(*))")
          .eq("empresa_id", data.empresa_id)
          .order("criado_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from("perfis")
          .select("id, nome, email, papel, ativo, criado_em")
          .eq("empresa_id", data.empresa_id)
          .order("nome", { ascending: true }),
        admin
          .from("clientes")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", data.empresa_id),
        admin
          .from("documentos")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", data.empresa_id),
        admin
          .from("documentos")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", data.empresa_id)
          .gte("criado_em", desde30),
      ]);

    if (!empresaRes.data) throw new Response("Empresa não encontrada", { status: 404 });

    return {
      empresa: empresaRes.data,
      assinatura: assinaturaRes.data ?? null,
      usuarios: usuariosRes.data ?? [],
      stats: {
        totalUsuarios: (usuariosRes.data ?? []).length,
        totalClientes: clientesCount.count ?? 0,
        totalDocumentos: docsCount.count ?? 0,
        documentos30d: docs30.count ?? 0,
      },
    };
  });