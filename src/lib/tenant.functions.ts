import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TenantContext } from "@/types";

export const getMyTenantContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TenantContext> => {
    const { supabase, userId } = context;

    const [{ data: memberships }, { data: roles }] = await Promise.all([
      supabase
        .from("tenant_users")
        .select("tenant_id, role, tenants:tenant_id ( id, name, slug, status, plan, onboarded_at )")
        .eq("user_id", userId),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
    const list = (memberships ?? []).map((m) => {
      const t = m.tenants as unknown as { id: string; name: string; slug: string; status: TenantContext["status"] };
      return { id: t.id, name: t.name, slug: t.slug, status: t.status };
    });

    const active = memberships?.[0];
    if (!active) {
      return {
        tenant: null,
        role: null,
        subscription: null,
        tenants: list,
        isSuperAdmin,
        status: null,
        subscriptionStatus: null,
        plan: null,
      };
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", active.tenant_id)
      .maybeSingle();
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", active.tenant_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      tenant,
      role: active.role,
      subscription,
      tenants: list,
      isSuperAdmin,
      status: tenant?.status ?? null,
      subscriptionStatus: subscription?.status ?? null,
      plan: tenant?.plan ?? null,
    };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenant_id: z.string().uuid(),
        segment: z.string().min(1),
        size: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({ segment: data.segment, size: data.size, onboarded_at: new Date().toISOString() })
      .eq("id", data.tenant_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });