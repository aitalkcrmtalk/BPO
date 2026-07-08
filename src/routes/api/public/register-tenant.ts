import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  company_name: z.string().min(2),
  document: z.string().min(11),
  segment: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  requester_name: z.string().min(2),
  requester_email: z.string().email(),
  requester_role: z.string().optional().default(""),
  terms: z.literal(true),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

export const Route = createFileRoute("/api/public/register-tenant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try { body = await request.json(); } catch { return Response.json({ error: "Payload inválido" }, { status: 400 }); }
        const parsed = Schema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = supabaseAdmin as any;
        const { generateProtocol } = await import("@/lib/temp-password.server");
        const { fireN8nWebhook } = await import("@/lib/n8n.server");

        const slug = `${slugify(parsed.data.company_name)}-${Math.random().toString(36).slice(2, 6)}`;
        const protocol = generateProtocol();

        const { data: tenant, error: tenErr } = await admin
          .from("tenants")
          .insert({
            name: parsed.data.company_name, slug, document: parsed.data.document,
            segment: parsed.data.segment || null, phone: parsed.data.phone || null,
            status: "pending", plan: "free",
          })
          .select("id").single();
        if (tenErr || !tenant) return Response.json({ error: tenErr?.message ?? "Falha ao criar tenant" }, { status: 500 });

        const { error: apErr } = await admin.from("internal_approvals").insert({
          tenant_id: tenant.id, protocol,
          requester_email: parsed.data.requester_email,
          requester_name: parsed.data.requester_name,
          requester_phone: parsed.data.phone || null,
          requester_role: parsed.data.requester_role || null,
          status: "pending",
        });
        if (apErr) return Response.json({ error: apErr.message }, { status: 500 });

        void fireN8nWebhook("tenant-registered", {
          protocol, company_name: parsed.data.company_name,
          requester_name: parsed.data.requester_name,
          requester_email: parsed.data.requester_email,
        });

        return Response.json({ ok: true, protocol });
      },
    },
  },
});