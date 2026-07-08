import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Subscription, Tenant, TenantContext } from "@/types";
import type { TenantRole } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export const getMyTenantContext = createServerFn({ method: "GET" })
  .handler(async (): Promise<TenantContext> => {
    // Wrapper delegates to protected impl via middleware — we can't attach
    // middleware conditionally, so use the middleware variant below directly.
    throw new Error("Use getMyTenantContextAuthed");
  });

export const getMyTenantContextAuthed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TenantContext> => {
    const supabase = context.supabase as AnyClient;
    const userId = context.userId as string;

    const [membershipsRes, rolesRes] = await Promise.all([
      supabase.from("tenant_users").select("tenant_id, role").eq("user_id", userId),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const memberships = (membershipsRes.data ?? []) as Array<{ tenant_id: string; role: TenantRole }>;
    const roles = (rolesRes.data ?? []) as Array<{ role: string }>;
    const isSuperAdmin = roles.some((r) => r.role === "super_admin");

    if (memberships.length === 0) {
      return {
        tenant: null,
        role: null,
        subscription: null,
        tenants: [],
        isSuperAdmin,
        status: null,
        subscriptionStatus: null,
        plan: null,
      };
    }

    const tenantIds = memberships.map((m) => m.tenant_id);
    const tenantsRes = await supabase.from("tenants").select("*").in("id", tenantIds);
    const tenants = (tenantsRes.data ?? []) as Tenant[];

    const active = memberships[0];
    const tenant = tenants.find((t) => t.id === active.tenant_id) ?? null;

    const subRes = await supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", active.tenant_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const subscription = (subRes.data ?? null) as Subscription | null;

    return {
      tenant,
      role: active.role,
      subscription,
      tenants: tenants.map((t) => ({ id: t.id, name: t.name, slug: t.slug, status: t.status })),
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
    const supabase = context.supabase as AnyClient;
    const { error } = await supabase
      .from("tenants")
      .update({ segment: data.segment, size: data.size, onboarded_at: new Date().toISOString() })
      .eq("id", data.tenant_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });