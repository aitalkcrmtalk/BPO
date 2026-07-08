import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats } from "@/lib/admin.functions";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const fn = useServerFn(adminStats);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  const stats = [
    { label: "Empresas ativas", value: data?.empresasAtivas ?? 0 },
    { label: "Empresas inativas", value: data?.empresasInativas ?? 0 },
    { label: "Perfis", value: data?.totalPerfis ?? 0 },
    { label: "Documentos", value: data?.totalDocumentos ?? 0 },
    { label: "Docs (30d)", value: data?.documentos30d ?? 0 },
    { label: "MRR estimado", value: formatBRL(data?.mrrEstimado ?? 0) },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold">Painel Super Admin</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}