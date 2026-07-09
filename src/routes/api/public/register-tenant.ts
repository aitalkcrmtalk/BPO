import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  company_name: z.string().min(2),
  document: z.string().min(11),
  razao_social: z.string().optional().default(""),
  requester_name: z.string().min(2),
  requester_email: z.string().email(),
  terms: z.literal(true),
});

export const Route = createFileRoute("/api/public/register-tenant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Payload inválido" }, { status: 400 });
        }
        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = supabaseAdmin as any;
        const { fireN8nWebhook } = await import("@/lib/n8n.server");

        // 1. Cria empresa
        const { data: empresa, error: empErr } = await admin
          .from("empresas")
          .insert({
            nome: parsed.data.company_name,
            razao_social: parsed.data.razao_social || null,
            cnpj: parsed.data.document,
            ativo: true,
          })
          .select("id")
          .single();
        if (empErr || !empresa) {
          return Response.json({ error: empErr?.message ?? "Falha ao criar empresa" }, { status: 500 });
        }

        // 2. Convida usuário admin por email
        const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(
          parsed.data.requester_email,
          {
            data: {
              empresa_id: empresa.id,
              nome: parsed.data.requester_name,
              papel: "admin",
            },
          },
        );
        if (invErr || !invited?.user) {
          return Response.json({ error: invErr?.message ?? "Falha ao convidar usuário" }, { status: 500 });
        }

        // 3. Cria perfil vinculado (o trigger criar_perfil_automatico pode fazer isso;
        //    usamos upsert para ser idempotente).
        await admin.from("perfis").upsert(
          {
            usuario_id: invited.user.id,
            empresa_id: empresa.id,
            nome: parsed.data.requester_name,
            email: parsed.data.requester_email,
            papel: "admin",
          },
          { onConflict: "usuario_id" },
        );

        void fireN8nWebhook("empresa-cadastrada", {
          empresa_id: empresa.id,
          nome_empresa: parsed.data.company_name,
          responsavel: parsed.data.requester_name,
          email: parsed.data.requester_email,
        });

        return Response.json({ ok: true, empresa_id: empresa.id });
      },
    },
  },
});