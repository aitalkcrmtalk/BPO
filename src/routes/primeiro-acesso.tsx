import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/primeiro-acesso")({
  component: FirstAccessPage,
  head: () => ({ meta: [{ title: "Primeiro acesso — CRM Talk" }] }),
});

function FirstAccessPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Mínimo 8 caracteres");
    if (password !== confirm) return toast.error("Senhas não conferem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha definida. Bem-vindo!");
    navigate({ to: "/app/onboarding" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Primeiro acesso</h1>
          <p className="mt-1 text-sm text-muted-foreground">Defina sua senha para começar a usar o CRM Talk.</p>
          <div className="mt-6 space-y-4">
            <div className="space-y-2"><Label htmlFor="p1">Nova senha</Label><Input id="p1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="p2">Confirme a senha</Label><Input id="p2" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Salvando…" : "Continuar"}</Button>
          </div>
        </form>
      </main>
      <PublicFooter />
    </div>
  );
}