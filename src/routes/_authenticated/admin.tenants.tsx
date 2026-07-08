import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { listAllTenants, setTenantStatus } from "@/lib/admin.functions";
import type { Tenant } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/tenants")({ component: Page });

function Page() {
  const listFn = useServerFn(listAllTenants);
  const setFn = useServerFn(setTenantStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["all-tenants"], queryFn: () => listFn() });
  const mut = useMutation({
    mutationFn: (args: { tenant_id: string; status: "approved" | "suspended" }) => setFn({ data: args }),
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["all-tenants"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Tenants</h1>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {((data ?? []) as Tenant[]).map((t) => (
          <div key={t.id} className="flex items-center justify-between border-b px-6 py-4 last:border-b-0">
            <div>
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.slug} · plano {t.plan}</div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={t.status} />
              {t.status === "approved" && (
                <Button size="sm" variant="outline" onClick={() => mut.mutate({ tenant_id: t.id, status: "suspended" })}>Suspender</Button>
              )}
              {t.status === "suspended" && (
                <Button size="sm" onClick={() => mut.mutate({ tenant_id: t.id, status: "approved" })}>Reativar</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}