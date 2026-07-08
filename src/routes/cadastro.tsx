import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/cadastro")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Cadastro — CRM Talk" }] }),
});

type FormState = {
  company_name: string; document: string; razao_social: string;
  requester_name: string; requester_email: string; terms: boolean;
};
const initial: FormState = { company_name: "", document: "", razao_social: "", requester_name: "", requester_email: "", terms: false };

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  function upd<K extends keyof FormState>(k: K, v: FormState[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.terms) return toast.error("Aceite os termos para continuar.");
    setLoading(true);
    try {
      const res = await fetch("/api/public/register-tenant", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha no envio");
      navigate({ to: "/cadastro/aguardando", search: { email: form.requester_email } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span className={step >= 1 ? "text-primary" : ""}>1. Empresa</span><span>→</span>
            <span className={step >= 2 ? "text-primary" : ""}>2. Responsável</span><span>→</span>
            <span className={step >= 3 ? "text-primary" : ""}>3. Confirmação</span>
          </div>
          <h1 className="text-2xl font-bold">Solicitar acesso</h1>
          <p className="mt-1 text-sm text-muted-foreground">Nossa equipe aprova em até 24h úteis.</p>
          {step === 1 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Nome fantasia" id="company_name" v={form.company_name} on={(v) => upd("company_name", v)} />
              <Field label="CNPJ" id="document" v={form.document} on={(v) => upd("document", v)} />
              <div className="md:col-span-2">
                <Field label="Razão social" id="razao_social" v={form.razao_social} on={(v) => upd("razao_social", v)} />
              </div>
              <div className="md:col-span-2 flex justify-end"><Button onClick={() => setStep(2)} disabled={!form.company_name || !form.document}>Continuar</Button></div>
            </div>
          )}
          {step === 2 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Seu nome" id="req_name" v={form.requester_name} on={(v) => upd("requester_name", v)} />
              <Field label="Email corporativo" id="req_email" type="email" v={form.requester_email} on={(v) => upd("requester_email", v)} />
              <div className="md:col-span-2 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={() => setStep(3)} disabled={!form.requester_name || !form.requester_email}>Continuar</Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <div><span className="text-muted-foreground">Empresa:</span> {form.company_name}</div>
                <div><span className="text-muted-foreground">CNPJ:</span> {form.document}</div>
                <div><span className="text-muted-foreground">Responsável:</span> {form.requester_name} ({form.requester_email})</div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={form.terms} onCheckedChange={(c) => upd("terms", Boolean(c))} />
                <span>Li e aceito os termos de uso e política de privacidade.</span>
              </label>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
                <Button onClick={submit} disabled={loading}>{loading ? "Enviando…" : "Solicitar acesso"}</Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function Field({ label, id, v, on, type = "text" }: { label: string; id: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={v} onChange={(e) => on(e.target.value)} />
    </div>
  );
}