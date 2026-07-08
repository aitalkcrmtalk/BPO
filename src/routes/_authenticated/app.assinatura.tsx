import { createFileRoute } from "@tanstack/react-router";
import { useTenantContext } from "@/hooks/useTenantContext";
import { PLANS, planByTier } from "@/lib/plans";
import { PlanCard } from "@/components/PlanCard";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/app/assinatura")({ component: Page });

function Page() {
  const { data } = useTenantContext();
  const current = data?.plan ? planByTier(data.plan) : null;
  return (
    <div>
      <h1 className="text-2xl font-bold">Assinatura</h1>
      {current && (
        <div className="mt-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">Plano atual</div>
            <div className="text-lg font-semibold">{current.name}</div>
            {data?.subscriptionStatus && <StatusBadge status={data.subscriptionStatus} />}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{current.description}</div>
        </div>
      )}
      <h2 className="mt-8 text-lg font-semibold">Fazer upgrade</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => <PlanCard key={p.tier} plan={p} ctaLabel="Assinar (em breve)" />)}
      </div>
    </div>
  );
}