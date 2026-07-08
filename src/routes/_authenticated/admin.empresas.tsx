import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge, empresaAtivaVariant } from "@/components/StatusBadge";
import { listAllEmpresas, setEmpresaAtivo } from "@/lib/admin.functions";
import type { Empresa } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/empresas")({ component: Page });

function Page() {
  const listFn = useServerFn(listAllEmpresas);
  const setFn = useServerFn(setEmpresaAtivo);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["all-empresas"], queryFn: () => listFn() });
  const mut = useMutation({
    mutationFn: (args: { empresa_id: string; ativo: boolean }) => setFn({ data: args }),
    onSuccess: () => {
      toast.success("Atualizado");
      qc.invalidateQueries({ queryKey: ["all-empresas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Empresas</h1>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {((data ?? []) as Empresa[]).map((e) => (
          <div key={e.id} className="flex items-center justify-between border-b px-6 py-4 last:border-b-0">
            <div>
              <div className="font-semibold">{e.nome}</div>
              <div className="text-xs text-muted-foreground">
                {e.razao_social ?? "—"} · CNPJ {e.cnpj ?? "—"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge label={e.ativo ? "ativa" : "inativa"} variant={empresaAtivaVariant(e.ativo)} />
              <Button
                size="sm"
                variant={e.ativo ? "outline" : "default"}
                onClick={() => mut.mutate({ empresa_id: e.id, ativo: !e.ativo })}
              >
                {e.ativo ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}