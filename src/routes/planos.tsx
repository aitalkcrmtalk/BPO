import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { PlanCard } from "@/components/PlanCard";
import { PLANS } from "@/lib/plans";

export const Route = createFileRoute("/planos")({
  component: PlanosPage,
  head: () => ({
    meta: [
      { title: "Planos — CRM Talk" },
      { name: "description", content: "Compare os planos do CRM Talk e escolha o que se encaixa no seu BPO." },
      { property: "og:title", content: "Planos — CRM Talk" },
      { property: "og:url", content: "/planos" },
    ],
    links: [{ rel: "canonical", href: "/planos" }],
  }),
});

function PlanosPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight">Planos que crescem com você</h1>
            <p className="mt-4 text-muted-foreground">Comece grátis e escale conforme a demanda do seu BPO.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <PlanCard key={p.tier} plan={p} onSelect={() => navigate({ to: "/cadastro" })} />
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}