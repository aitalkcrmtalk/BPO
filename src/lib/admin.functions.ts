import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateTempPassword } from "@/lib/temp-password.server";
import { fireN8nWebhook } from "@/lib/n8n.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function assertSuperAdmin(supabase: AnyClient, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "super_admin").maybeSingle();
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const listPendingApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { data, error } = await supabase
      .from("internal_approvals")
      .select("*, tenants:tenant_id ( id, name, slug, document, segment )")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAllTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { data, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const [pending, approved, rejected] = await Promise.all([
      supabase.from("internal_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    ]);
    return {
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
    };
  });

export const approveTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ approval_id: z.string().uuid(), notes: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;

    const { data: approval, error: apErr } = await admin
      .from("internal_approvals")
      .select("*, tenants:tenant_id (*)")
      .eq("id", data.approval_id)
      .maybeSingle();
    if (apErr || !approval) throw new Error("Aprovação não encontrada");
    if (approval.status !== "pending") throw new Error("Aprovação já processada");

    const tempPassword = generateTempPassword();
    const tenantId = approval.tenant_id as string;

    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email: approval.requester_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true, tenant_id: tenantId, full_name: approval.requester_name },
    });
    if (userErr || !created?.user) throw new Error(userErr?.message ?? "Falha ao criar usuário");

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

    await admin.from("tenant_users").insert({ tenant_id: tenantId, user_id: created.user.id, role: "owner" });
    await admin.from("subscriptions").insert({ tenant_id: tenantId, plan: "free", status: "trialing", current_period_end: periodEnd });
    await admin.from("tenants").update({ status: "approved", approved_at: now.toISOString(), approved_by: context.userId }).eq("id", tenantId);
    await admin
      .from("internal_approvals")
      .update({ status: "approved", reviewed_at: now.toISOString(), reviewed_by: context.userId, notes: data.notes ?? null })
      .eq("id", data.approval_id);
    await admin.from("audit_logs").insert({
      tenant_id: tenantId,
      user_id: context.userId,
      action: "tenant.approved",
      metadata: { approval_id: data.approval_id },
    });

    await fireN8nWebhook("tenant-approved", {
      email: approval.requester_email,
      temp_password: tempPassword,
      tenant_name: approval.tenants?.name ?? "",
      requester_name: approval.requester_name,
    });

    return { ok: true };
  });

export const rejectTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ approval_id: z.string().uuid(), notes: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;

    const { data: approval } = await admin.from("internal_approvals").select("*").eq("id", data.approval_id).maybeSingle();
    if (!approval) throw new Error("Aprovação não encontrada");

    const now = new Date().toISOString();
    await admin.from("tenants").update({ status: "rejected" }).eq("id", approval.tenant_id);
    await admin
      .from("internal_approvals")
      .update({ status: "rejected", reviewed_at: now, reviewed_by: context.userId, notes: data.notes })
      .eq("id", data.approval_id);
    await admin.from("audit_logs").insert({
      tenant_id: approval.tenant_id,
      user_id: context.userId,
      action: "tenant.rejected",
      metadata: { approval_id: data.approval_id, notes: data.notes },
    });

    await fireN8nWebhook("tenant-rejected", {
      email: approval.requester_email,
      requester_name: approval.requester_name,
      notes: data.notes,
    });

    return { ok: true };
  });

export const setTenantStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ tenant_id: z.string().uuid(), status: z.enum(["approved", "suspended"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    await assertSuperAdmin(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as AnyClient;
    await admin.from("tenants").update({ status: data.status }).eq("id", data.tenant_id);
    await admin.from("audit_logs").insert({
      tenant_id: data.tenant_id,
      user_id: context.userId,
      action: `tenant.${data.status}`,
    });
    return { ok: true };
  });