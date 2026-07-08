import { createFileRoute } from "@tanstack/react-router";
import { useTenantContext } from "@/hooks/useTenantContext";

export const Route = createFileRoute("/_authenticated/app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useTenantContext();
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Bem-vindo{data?.empresa ? `, ${data.empresa.nome}` : ""}.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {["Documentos processados", "Automações ativas", "Clientes"].map((label) => (
          <div key={label} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-bold">0</div>
          </div>
        ))}
      </div>
    </div>
  );
}