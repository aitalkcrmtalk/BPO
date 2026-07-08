import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getMeuWebhook,
  upsertMeuWebhook,
  deletarMeuWebhook,
  testarWebhook,
} from "@/lib/webhooks.functions";

export const Route = createFileRoute("/_authenticated/app/automacoes")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMeuWebhook);
  const upsertFn = useServerFn(upsertMeuWebhook);
  const delFn = useServerFn(deletarMeuWebhook);
  const testFn = useServerFn(testarWebhook);

  const { data } = useQuery({ queryKey: ["webhook-empresa"], queryFn: () => getFn() });

  const [form, setForm] = useState({
    url: "",
    secret: "",
    ativo: true,
    eventos: "documento.criado,documento.atualizado",
  });

  useEffect(() => {
    if (data) {
      setForm({
        url: data.url ?? "",
        secret: data.secret ?? "",
        ativo: data.ativo ?? true,
        eventos: (data.eventos ?? []).join(","),
      });
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          url: form.url,
          secret: form.secret,
          ativo: form.ativo,
          eventos: form.eventos.split(",").map((s) => s.trim()).filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Webhook salvo");
      qc.invalidateQueries({ queryKey: ["webhook-empresa"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: () => testFn(),
    onSuccess: (r) => toast.success(`n8n respondeu HTTP ${r.status}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: () => delFn(),
    onSuccess: () => {
      toast.success("Webhook removido");
      setForm({ url: "", secret: "", ativo: true, eventos: "documento.criado,documento.atualizado" });
      qc.invalidateQueries({ queryKey: ["webhook-empresa"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Automações (n8n)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure um webhook para enviar eventos de documentos para o seu fluxo n8n. O
        callback do n8n deve ser assinado com HMAC-SHA256 e enviado para
        <code className="mx-1 rounded bg-muted px-1">/api/public/n8n-callback</code>.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <Label>URL do webhook</Label>
          <Input
            placeholder="https://n8n.exemplo.com/webhook/xxx"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          />
        </div>
        <div>
          <Label>Secret (HMAC)</Label>
          <Input
            placeholder="Mínimo 16 caracteres"
            value={form.secret}
            onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Mesmo segredo deve ser configurado no n8n para validar o header{" "}
            <code>x-signature</code>.
          </p>
        </div>
        <div>
          <Label>Eventos (separados por vírgula)</Label>
          <Input
            value={form.eventos}
            onChange={(e) => setForm((f) => ({ ...f, eventos: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.ativo}
            onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
          />
          <span className="text-sm">Ativo</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            Salvar
          </Button>
          <Button
            variant="outline"
            onClick={() => testMut.mutate()}
            disabled={!data || testMut.isPending}
          >
            Testar disparo
          </Button>
          {data && (
            <Button variant="destructive" onClick={() => delMut.mutate()}>
              Remover
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}