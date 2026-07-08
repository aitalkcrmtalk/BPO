import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogs } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/audit-logs")({ component: Page });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Log = any;

function Page() {
  const fn = useServerFn(listAuditLogs);
  const { data, isLoading } = useQuery({ queryKey: ["audit-logs"], queryFn: () => fn() });
  return (
    <div>
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {(data ?? []).map((l: Log) => (
          <div key={l.id} className="flex items-center justify-between border-b px-6 py-3 text-sm last:border-b-0">
            <div>
              <div className="font-medium">{l.action}</div>
              <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</div>
            </div>
            <div className="text-xs text-muted-foreground">tenant {l.tenant_id?.slice(0, 8) ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}