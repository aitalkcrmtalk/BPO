import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, empresaAtivaVariant } from "@/components/StatusBadge";
import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import {
  listAllEmpresas,
  setEmpresaAtivo,
  getAssinaturaEmpresa,
  setAssinaturaStatus,
  toggleItemAssinatura,
} from "@/lib/admin.functions";
import { formatBRL } from "@/lib/format";
import type { Empresa } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/empresas")({ component: Page });

function Page() {
  const listFn = useServerFn(listAllEmpresas);
  const setFn = useServerFn(setEmpresaAtivo);
  const qc = useQueryClient();
  const [assinaturaOf, setAssinaturaOf] = useState<Empresa | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["all-empresas"], queryFn: () => listFn() });
  const mut = useMutation({
    mutationFn: (args: { empresa_id: string; ativo: boolean }) => setFn({ data: args }),
    onSuccess: () => {
      toast.success("Atualizado");
      qc.invalidateQueries({ queryKey: ["all-empresas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Empresas</h1>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {((data ?? []) as Empresa[]).map((e) => (
          <div key={e.id} className="flex items-center justify-between border-b px-6 py-4 last:border-b-0">
            <div>
              <Link
                to="/admin/empresas/$empresaId"
                params={{ empresaId: e.id }}
                className="font-semibold hover:underline"
              >
                {e.nome}
              </Link>
              <div className="text-xs text-muted-foreground">
                {e.razao_social ?? "—"} · CNPJ {e.cnpj ?? "—"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge label={e.ativo ? "ativa" : "inativa"} variant={empresaAtivaVariant(e.ativo)} />
              <Button size="sm" variant="ghost" asChild>
                <Link to="/admin/empresas/$empresaId" params={{ empresaId: e.id }}>
                  <Eye className="mr-1 h-4 w-4" /> Ver perfil
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAssinaturaOf(e)}>
                Assinatura
              </Button>
              <Button
                size="sm"
                variant={e.ativo ? "outline" : "default"}
                onClick={() => mut.mutate({ empresa_id: e.id, ativo: !e.ativo })}
              >
                {e.ativo ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AssinaturaDialog
        empresa={assinaturaOf}
        onClose={() => setAssinaturaOf(null)}
      />
    </div>
  );
}

function AssinaturaDialog({
  empresa,
  onClose,
}: {
  empresa: Empresa | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getAssinaturaEmpresa);
  const setStatusFn = useServerFn(setAssinaturaStatus);
  const toggleItemFn = useServerFn(toggleItemAssinatura);

  const { data } = useQuery({
    queryKey: ["assinatura", empresa?.id],
    queryFn: () => getFn({ data: { empresa_id: empresa!.id } }),
    enabled: !!empresa,
  });

  const ass = data?.assinatura as
    | {
        id: string;
        status: string;
        plano: string;
        valor_base: number;
        itens_assinatura?: { modulo_id: string; ativo: boolean }[];
      }
    | null
    | undefined;
  const modulos = (data?.modulosDisponiveis ?? []) as {
    id: string;
    nome: string;
    valor_base: number;
  }[];

  const [status, setStatus] = useState<string>("ativa");
  const [plano, setPlano] = useState<string>("padrao");
  const [valorBase, setValorBase] = useState<number>(0);

  useEffect(() => {
    if (ass) {
      setStatus(ass.status);
      setPlano(ass.plano);
      setValorBase(Number(ass.valor_base ?? 0));
    }
  }, [ass?.id, ass?.status, ass?.plano, ass?.valor_base]);

  const saveStatus = useMutation({
    mutationFn: () =>
      setStatusFn({
        data: {
          empresa_id: empresa!.id,
          status: status as "ativa" | "suspensa" | "cancelada" | "trial" | "atrasada",
          plano,
          valor_base: valorBase,
        },
      }),
    onSuccess: () => {
      toast.success("Assinatura salva");
      qc.invalidateQueries({ queryKey: ["assinatura", empresa?.id] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (args: { modulo_id: string; ativo: boolean }) =>
      toggleItemFn({
        data: { assinatura_id: ass!.id, modulo_id: args.modulo_id, ativo: args.ativo },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assinatura", empresa?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const isOpen = !!empresa;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assinatura — {empresa?.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["ativa", "trial", "suspensa", "atrasada", "cancelada"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Plano</Label>
            <Input value={plano} onChange={(e) => setPlano(e.target.value)} />
          </div>
          <div>
            <Label>Valor base (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={String(valorBase)}
              onChange={(e) => setValorBase(Number(e.target.value))}
            />
          </div>
          <Button onClick={() => saveStatus.mutate()} disabled={saveStatus.isPending}>
            Salvar assinatura
          </Button>

          {ass && (
            <div className="pt-4">
              <Label>Módulos contratados</Label>
              <div className="mt-2 space-y-2 rounded-md border p-3">
                {modulos.map((m) => {
                  const it = ass.itens_assinatura?.find((x) => x.modulo_id === m.id);
                  const ativo = !!it?.ativo;
                  return (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <div>
                        {m.nome}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatBRL(m.valor_base)}
                        </span>
                      </div>
                      <Switch
                        checked={ativo}
                        onCheckedChange={(v) =>
                          toggleMut.mutate({ modulo_id: m.id, ativo: v })
                        }
                      />
                    </div>
                  );
                })}
                {modulos.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum módulo cadastrado.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}