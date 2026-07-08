import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/lib/tenant.functions";
import { useTenantContext } from "@/hooks/useTenantContext";

export const Route = createFileRoute("/_authenticated/app/onboarding")({ component: Onboarding });

function Onboarding() {
  const { data, refetch } = useTenantContext();
  const navigate = useNavigate();
  const [segment, setSegment] = useState("");
  const [size, setSize] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = useServerFn(completeOnboarding);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.tenant) return;
    setLoading(true);
    try {
      await submit({ data: { tenant_id: data.tenant.id, segment, size } });
      await refetch();
      toast.success("Onboarding concluído!");
      navigate({ to: "/app/dashboard" });
    } catch (err) { toast.error((err as Error).message); }
    finally { setLoading(false); }
  }

  if (!data?.tenant) {
    return <div className="text-sm text-muted-foreground">Aguardando dados do tenant…</div>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Vamos configurar seu ambiente</h1>
      <p className="mt-1 text-sm text-muted-foreground">Só precisamos de duas informações para começar.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-2"><Label htmlFor="segment">Segmento</Label><Input id="segment" value={segment} onChange={(e) => setSegment(e.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="size">Tamanho da operação</Label><Input id="size" placeholder="ex.: 1-10 colaboradores" value={size} onChange={(e) => setSize(e.target.value)} required /></div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Salvando…" : "Concluir"}</Button>
      </form>
    </div>
  );
}