import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyHmac } from "@/lib/webhooks.server";

const bodySchema = z.object({
  empresa_id: z.string().uuid(),
  documento_id: z.string().uuid(),
  status: z.string().optional(),
  valor: z.number().nullable().optional(),
  data_emissao: z.string().nullable().optional(),
  data_vencimento: z.string().nullable().optional(),
  emissor_documento: z.string().nullable().optional(),
  metadados: z.record(z.string(), z.unknown()).optional(),
});

export const Route = createFileRoute("/api/public/n8n-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-signature");

        let payload: z.infer<typeof bodySchema>;
        try {
          payload = bodySchema.parse(JSON.parse(raw));
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = supabaseAdmin as any;

        // Busca secret da empresa; fallback pro secret global.
        const { data: hook } = await admin
          .from("webhooks_empresa")
          .select("secret, ativo")
          .eq("empresa_id", payload.empresa_id)
          .maybeSingle();

        const secret =
          (hook?.ativo && hook?.secret) || process.env.N8N_CALLBACK_SIGNING_KEY || "";
        if (!secret || !verifyHmac(raw, secret, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
        if (payload.status !== undefined) patch.status = payload.status;
        if (payload.valor !== undefined) patch.valor = payload.valor;
        if (payload.data_emissao !== undefined) patch.data_emissao = payload.data_emissao;
        if (payload.data_vencimento !== undefined) patch.data_vencimento = payload.data_vencimento;
        if (payload.emissor_documento !== undefined)
          patch.emissor_documento = payload.emissor_documento;
        if (payload.metadados !== undefined) patch.metadados = payload.metadados;

        const { error } = await admin
          .from("documentos")
          .update(patch)
          .eq("id", payload.documento_id)
          .eq("empresa_id", payload.empresa_id);

        if (error) {
          console.error("[n8n-callback] update error:", error);
          return new Response("Update failed", { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});