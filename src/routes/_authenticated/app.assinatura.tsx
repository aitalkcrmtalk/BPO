import { createFileRoute } from "@tanstack/react-router";
import { useTenantContext } from "@/hooks/useTenantContext";
import { StatusBadge, subscriptionVariant } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/app/assinatura")({ component: Page });

function Page() {
  const { data } = useTenantContext();
  const assinatura = data?.assinatura;
  const modulos = data?.modulosAtivos ?? [];
  return (
    <div>
      <h1 className="text-2xl font-bold">Assinatura</h1>
      {assinatura ? (
        <div className="mt-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">Plano atual</div>
            <div className="text-lg font-semibold">{assinatura.plano}</div>
            <StatusBadge label={assinatura.status} variant={subscriptionVariant(assinatura.status)} />
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Valor base: R$ {Number(assinatura.valor_base ?? 0).toFixed(2)}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Nenhuma assinatura ativa para sua empresa.
        </div>
      )}
      <h2 className="mt-8 text-lg font-semibold">Módulos ativos</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modulos.length === 0 && (
          <div className="text-sm text-muted-foreground">Nenhum módulo ativo.</div>
        )}
        {modulos.map((m) => (
          <div key={m.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="font-medium">{m.nome}</div>
            <div className="text-xs text-muted-foreground">chave: {m.chave}</div>
          </div>
        ))}
      </div>
    </div>
  );
}