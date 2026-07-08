import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recuperar-senha")({
  component: RecoverPage,
  head: () => ({ meta: [{ title: "Recuperar senha — CRM Talk" }] }),
});

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          {sent ? (
            <p className="mt-4 text-sm text-muted-foreground">Se o email estiver cadastrado, enviamos um link de recuperação.</p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando…" : "Enviar link"}</Button>
            </div>
          )}
        </form>
      </main>
      <PublicFooter />
    </div>
  );
}