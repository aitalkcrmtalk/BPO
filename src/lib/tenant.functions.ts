import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Assinatura, Empresa, EmpresaContext, Modulo, Perfil } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export const getMyTenantContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmpresaContext> => {
    const supabase = context.supabase as AnyClient;
    const userId = context.userId as string;

    const [perfilRes, rolesRes] = await Promise.all([
      supabase.from("perfis").select("*").eq("usuario_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const perfil = (perfilRes.data ?? null) as Perfil | null;
    const roles = (rolesRes.data ?? []) as Array<{ role: string }>;
    const isSuperAdmin = roles.some((r) => r.role === "super_admin");

    if (!perfil) {
      return {
        empresa: null,
        perfil: null,
        papel: null,
        assinatura: null,
        modulosAtivos: [],
        isSuperAdmin,
        subscriptionStatus: null,
      };
    }

    const [empresaRes, assinaturaRes] = await Promise.all([
      supabase.from("empresas").select("*").eq("id", perfil.empresa_id).maybeSingle(),
      supabase
        .from("assinaturas")
        .select("*")
        .eq("empresa_id", perfil.empresa_id)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const empresa = (empresaRes.data ?? null) as Empresa | null;
    const assinatura = (assinaturaRes.data ?? null) as Assinatura | null;

    let modulosAtivos: Modulo[] = [];
    if (assinatura) {
      const itensRes = await supabase
        .from("itens_assinatura")
        .select("modulo_id, ativo, modulos:modulo_id (id, chave, nome, ativo, criado_em)")
        .eq("assinatura_id", assinatura.id)
        .eq("ativo", true);
      modulosAtivos = ((itensRes.data ?? []) as Array<{ modulos: Modulo | null }>)
        .map((r) => r.modulos)
        .filter((m): m is Modulo => Boolean(m));
    }

    return {
      empresa,
      perfil,
      papel: perfil.papel ?? null,
      assinatura,
      modulosAtivos,
      isSuperAdmin,
      subscriptionStatus: assinatura?.status ?? null,
    };
  });