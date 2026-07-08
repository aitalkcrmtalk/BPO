import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMeusPerfis } from "@/lib/empresa-data.functions";
import { StatusBadge } from "@/components/StatusBadge";
import type { Perfil } from "@/types";

export const Route = createFileRoute("/_authenticated/app/usuarios")({ component: Page });

function Page() {
  const listFn = useServerFn(listMeusPerfis);
  const { data, isLoading } = useQuery({ queryKey: ["meus-perfis"], queryFn: () => listFn() });
  return (
    <div>
      <h1 className="text-2xl font-bold">Usuários</h1>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {((data ?? []) as Perfil[]).map((p) => (
          <div key={p.id} className="flex items-center justify-between border-b px-6 py-4 last:border-b-0">
            <div>
              <div className="font-semibold">{p.nome}</div>
              <div className="text-xs text-muted-foreground">{p.email}</div>
            </div>
            <StatusBadge label={p.papel} variant={p.papel === "admin" ? "info" : "muted"} />
          </div>
        ))}
      </div>
    </div>
  );
}