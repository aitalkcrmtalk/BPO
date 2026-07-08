import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarCliente, listMeusClientes } from "@/lib/empresa-data.functions";
import type { Cliente } from "@/types";

export const Route = createFileRoute("/_authenticated/app/clientes")({ component: Page });

function Page() {
  const listFn = useServerFn(listMeusClientes);
  const createFn = useServerFn(criarCliente);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["meus-clientes"], queryFn: () => listFn() });
  const [form, setForm] = useState({ nome: "", cnpj: "", url_pasta_drive: "" });
  const mut = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("Cliente adicionado");
      setForm({ nome: "", cnpj: "", url_pasta_drive: "" });
      qc.invalidateQueries({ queryKey: ["meus-clientes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Clientes</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.nome) return;
          mut.mutate();
        }}
        className="mt-6 grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-4"
      >
        <div className="space-y-1">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input id="cnpj" value={form.cnpj} onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="drive">URL pasta Drive</Label>
          <Input id="drive" value={form.url_pasta_drive} onChange={(e) => setForm((f) => ({ ...f, url_pasta_drive: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={mut.isPending} className="w-full">
            {mut.isPending ? "Salvando…" : "Adicionar"}
          </Button>
        </div>
      </form>

      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {!isLoading && ((data ?? []) as Cliente[]).length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhum cliente cadastrado.</div>
        )}
        {((data ?? []) as Cliente[]).map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b px-6 py-4 last:border-b-0">
            <div>
              <div className="font-semibold">{c.nome}</div>
              <div className="text-xs text-muted-foreground">CNPJ {c.cnpj ?? "—"}</div>
            </div>
            {c.url_pasta_drive && (
              <a href={c.url_pasta_drive} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                Pasta Drive
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}