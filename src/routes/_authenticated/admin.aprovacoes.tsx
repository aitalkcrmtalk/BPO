import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listPendingApprovals, approveTenant, rejectTenant } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/aprovacoes")({ component: Page });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Approval = any;

function Page() {
  const listFn = useServerFn(listPendingApprovals);
  const approveFn = useServerFn(approveTenant);
  const rejectFn = useServerFn(rejectTenant);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["pending-approvals"], queryFn: () => listFn() });

  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { approval_id: id } }),
    onSuccess: () => { toast.success("Tenant aprovado. Email enviado."); qc.invalidateQueries({ queryKey: ["pending-approvals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Aprovações pendentes</h1>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {!isLoading && (data ?? []).length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhuma aprovação pendente.</div>
        )}
        {(data ?? []).map((a: Approval) => (
          <div key={a.id} className="flex items-center justify-between border-b px-6 py-4 last:border-b-0">
            <div>
              <div className="font-semibold">{a.tenants?.name ?? "—"}</div>
              <div className="text-sm text-muted-foreground">{a.requester_name} · {a.requester_email}</div>
              <div className="mt-1 text-xs text-muted-foreground">Protocolo {a.protocol}</div>
            </div>
            <div className="flex gap-2">
              <RejectDialog id={a.id} onDone={() => qc.invalidateQueries({ queryKey: ["pending-approvals"] })} rejectFn={rejectFn} />
              <Button size="sm" onClick={() => approve.mutate(a.id)} disabled={approve.isPending}>Aprovar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RejectDialog({ id, onDone, rejectFn }: { id: string; onDone: () => void; rejectFn: (args: { data: { approval_id: string; notes: string } }) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (!notes) return toast.error("Informe o motivo da rejeição.");
    setLoading(true);
    try {
      await rejectFn({ data: { approval_id: id, notes } });
      toast.success("Solicitação rejeitada.");
      setOpen(false); onDone();
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Rejeitar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Rejeitar solicitação</DialogTitle></DialogHeader>
        <Textarea placeholder="Motivo (será enviado ao solicitante)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={submit} disabled={loading}>{loading ? "Enviando…" : "Rejeitar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}