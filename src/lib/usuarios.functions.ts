import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getMeuPerfil(supabase: AnyClient, userId: string) {
  const { data } = await supabase
    .from("perfis")
    .select("id, empresa_id, papel")
    .eq("id", userId)
    .maybeSingle();
  return data as { id: string; empresa_id: string; papel: string } | null;
}

async function assertAdminDaEmpresa(supabase: AnyClient, userId: string): Promise<string> {
  const perfil = await getMeuPerfil(supabase, userId);
  if (!perfil) throw new Response("Sem perfil", { status: 403 });
  const { data: isSuper } = await supabase.rpc("has_platform_role", {
    _user_id: userId,
    _role: "super_admin",
  });
  if (perfil.papel !== "admin" && !isSuper) {
    throw new Response("Somente admin da empresa", { status: 403 });
  }
  return perfil.empresa_id;
}

export const listUsuariosDaEmpresa = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    const perfil = await getMeuPerfil(supabase, context.userId);
    if (!perfil) return [];
    const { data, error } = await supabase
      .from("perfis")
      .select("id, nome, email, papel, ativo, criado_em, usuarios_clientes(cliente_id)")
      .eq("empresa_id", perfil.empresa_id)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const convidarSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(2),
  papel: z.enum(["admin", "usuario"]),
  clientes_ids: z.array(z.string().uuid()).default([]),
});

export const convidarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => convidarSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await assertAdminDaEmpresa(supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;

    // Convite (cria auth.users e envia e-mail).
    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(
      data.email,
      { data: { nome: data.nome } },
    );
    if (invErr) throw new Error(invErr.message);
    const newUserId = invited?.user?.id as string | undefined;
    if (!newUserId) throw new Error("Falha ao criar usuário");

    // Perfil (o trigger criar_perfil_automatico pode já ter criado — fazer upsert defensivo).
    const { error: perfErr } = await admin.from("perfis").upsert(
      {
        id: newUserId,
        usuario_id: newUserId,
        empresa_id: empresaId,
        nome: data.nome,
        email: data.email,
        papel: data.papel,
        ativo: true,
      },
      { onConflict: "id" },
    );
    if (perfErr) throw new Error(perfErr.message);

    if (data.papel === "usuario" && data.clientes_ids.length > 0) {
      const rows = data.clientes_ids.map((cid) => ({ perfil_id: newUserId, cliente_id: cid }));
      const { error: vErr } = await admin.from("usuarios_clientes").insert(rows);
      if (vErr) throw new Error(vErr.message);
    }
    return { ok: true, user_id: newUserId };
  });

export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        perfil_id: z.string().uuid(),
        papel: z.enum(["admin", "usuario"]).optional(),
        ativo: z.boolean().optional(),
        clientes_ids: z.array(z.string().uuid()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await assertAdminDaEmpresa(supabase, context.userId);

    // Valida que o perfil-alvo é da mesma empresa.
    const { data: alvo } = await supabase
      .from("perfis")
      .select("id, empresa_id")
      .eq("id", data.perfil_id)
      .maybeSingle();
    if (!alvo || alvo.empresa_id !== empresaId) {
      throw new Response("Perfil fora da empresa", { status: 403 });
    }

    const patch: Record<string, unknown> = {};
    if (data.papel !== undefined) patch.papel = data.papel;
    if (data.ativo !== undefined) patch.ativo = data.ativo;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("perfis").update(patch).eq("id", data.perfil_id);
      if (error) throw new Error(error.message);
    }

    if (data.clientes_ids) {
      await supabase.from("usuarios_clientes").delete().eq("perfil_id", data.perfil_id);
      if (data.clientes_ids.length > 0) {
        const rows = data.clientes_ids.map((cid) => ({
          perfil_id: data.perfil_id,
          cliente_id: cid,
        }));
        const { error: iErr } = await supabase.from("usuarios_clientes").insert(rows);
        if (iErr) throw new Error(iErr.message);
      }
    }
    return { ok: true };
  });