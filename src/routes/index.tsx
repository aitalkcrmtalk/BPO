import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import heroBg from "@/assets/hero-bg.png.asset.json";
import { ArrowRight, Bot, ShieldCheck, Workflow, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CRM Talk — BPO como serviço (AaaS) para operações inteligentes" },
      {
        name: "description",
        content:
          "Automatize processos de BPO com IA: aprovações, documentos, automações e clientes em uma única plataforma multi-tenant.",
      },
      { property: "og:title", content: "CRM Talk — BPO automatizado com IA" },
      {
        property: "og:description",
        content:
          "Plataforma AaaS multi-tenant para escritórios de BPO: n8n, IA e Supabase integrados.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroBg.url}
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-primary/70" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
            <div className="max-w-3xl text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Automation as a Service
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
                O BPO inteligente que trabalha <span className="text-[color:var(--warning)]">24/7</span> para você.
              </h1>
              <p className="mt-6 text-lg text-primary-foreground/80 md:text-xl">
                CRM Talk é a plataforma multi-tenant que orquestra IA, n8n e dados para escalar sua operação de BPO sem aumentar seu time.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/cadastro">
                  <Button size="lg" className="bg-[color:var(--warning)] text-primary hover:bg-[color:var(--warning)]/90">
                    Solicitar acesso
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/planos">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                    Ver planos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Uma plataforma. Todo o seu BPO.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Da captura de documentos à aprovação final, com automações no n8n e IA integrada.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Bot,
                title: "IA aplicada",
                desc: "Extração, classificação e resumo de documentos com modelos ajustados ao seu domínio.",
              },
              {
                icon: Workflow,
                title: "Automações n8n",
                desc: "Orquestre workflows sob demanda, com webhooks seguros e triggers por tenant.",
              },
              {
                icon: ShieldCheck,
                title: "Multi-tenant seguro",
                desc: "RLS no Supabase, aprovação interna e auditoria completa de cada ação.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="rounded-3xl bg-primary p-10 text-primary-foreground md:p-16">
            <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Pronto para escalar seu BPO?
                </h2>
                <p className="mt-4 text-primary-foreground/80">
                  Solicite seu tenant. Nossa equipe aprova em até 24h úteis e libera seu ambiente completo.
                </p>
              </div>
              <div className="flex md:justify-end">
                <Link to="/cadastro">
                  <Button size="lg" className="bg-[color:var(--warning)] text-primary hover:bg-[color:var(--warning)]/90">
                    Começar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
