import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cadastro/aguardando")({
  validateSearch: z.object({ email: z.string().optional() }),
  component: WaitingPage,
  head: () => ({ meta: [{ title: "Cadastro enviado — CRM Talk" }] }),
});

function WaitingPage() {
  const { email } = Route.useSearch();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="h-6 w-6" /></div>
          <h1 className="mt-4 text-2xl font-bold">Empresa criada!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um convite para{email ? <> <span className="font-medium text-foreground">{email}</span></> : " seu email"}.
            Acesse o link recebido para definir sua senha e entrar.
          </p>
          <div className="mt-6"><Link to="/"><Button variant="outline">Voltar ao início</Button></Link></div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}