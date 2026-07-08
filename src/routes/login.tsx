import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — CRM Talk" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error || !data.user) return toast.error(error?.message ?? "Falha ao entrar");
    const meta = data.user.user_metadata as { must_change_password?: boolean } | undefined;
    if (meta?.must_change_password) return navigate({ to: "/primeiro-acesso" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "super_admin");
    navigate({ to: isAdmin ? "/admin/dashboard" : "/app/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse seu ambiente CRM Talk.</p>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</Button>
            <div className="flex items-center justify-between text-sm">
              <Link to="/recuperar-senha" className="text-primary hover:underline">Esqueci minha senha</Link>
              <Link to="/cadastro" className="text-primary hover:underline">Criar conta</Link>
            </div>
          </div>
        </form>
      </main>
      <PublicFooter />
    </div>
  );
}