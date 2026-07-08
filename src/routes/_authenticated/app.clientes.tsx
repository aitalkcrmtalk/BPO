import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/app/clientes")({ component: () => <Stub title="Clientes" /> });
function Stub({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-4 rounded-xl border bg-card p-8 text-center text-muted-foreground shadow-sm">Em breve — Fase 2</div>
    </div>
  );
}