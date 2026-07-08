import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listModulos, upsertModulo } from "@/lib/admin.functions";
import { formatBRL } from "@/lib/format";

type Modulo = { id: string; chave: string; nome: string; ativo: boolean; valor_base: number };

export const Route = createFileRoute("/_authenticated/admin/planos")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listModulos);
  const upFn = useServerFn(upsertModulo);
  const { data = [], isLoading } = useQuery({
    queryKey: ["modulos"],
    queryFn: () => listFn() as Promise<Modulo[]>,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Modulo>>({
    chave: "",
    nome: "",
    ativo: true,
    valor_base: 0,
  });

  function openNovo() {
    setForm({ chave: "", nome: "", ativo: true, valor_base: 0 });
    setOpen(true);
  }
  function openEdit(m: Modulo) {
    setForm(m);
    setOpen(true);
  }

  const mut = useMutation({
    mutationFn: () =>
      upFn({
        data: {
          id: form.id,
          chave: form.chave ?? "",
          nome: form.nome ?? "",
          ativo: form.ativo ?? true,
          valor_base: Number(form.valor_base ?? 0),
        },
      }),
    onSuccess: () => {
      toast.success("Módulo salvo");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["modulos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Módulos / Planos</h1>
        <Button onClick={openNovo}>Novo módulo</Button>
      </div>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {data.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between border-b px-6 py-4 last:border-b-0"
          >
            <div>
              <div className="font-semibold">{m.nome}</div>
              <div className="text-xs text-muted-foreground">
                {m.chave} · {formatBRL(m.valor_base)} · {m.ativo ? "ativo" : "inativo"}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
              Editar
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar módulo" : "Novo módulo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Chave</Label>
              <Input
                value={form.chave ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, chave: e.target.value }))}
                placeholder="ex: bpo_financeiro"
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                value={form.nome ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div>
              <Label>Valor base (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={String(form.valor_base ?? 0)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valor_base: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.ativo ?? true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
              />
              <span className="text-sm">Ativo</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}