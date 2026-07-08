import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { listMeusClientes } from "@/lib/empresa-data.functions";
import {
  listarDocumentos,
  upsertDocumento,
  deletarDocumento,
  TIPOS_DOCUMENTO,
  STATUS_DOCUMENTO,
} from "@/lib/documentos.functions";
import { StatusBadge, documentoStatusVariant } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/documentos")({ component: Page });

type Row = {
  id: string;
  titulo: string;
  status: string;
  tipo: string;
  criado_em: string;
  data_emissao: string | null;
  data_vencimento: string | null;
  valor: number | null;
  emissor_documento: string | null;
  observacoes: string | null;
  url_arquivo: string | null;
  cliente_id: string | null;
  clientes: { id: string; nome: string } | null;
};

type Cliente = { id: string; nome: string };

const TIPO_LABEL: Record<string, string> = {
  nota_fiscal: "Nota fiscal",
  contrato: "Contrato",
  comprovante: "Comprovante",
  boleto: "Boleto",
  outros: "Outros",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_processamento: "Em processamento",
  concluido: "Concluído",
  rejeitado: "Rejeitado",
  arquivado: "Arquivado",
};

const NONE = "__none__";
const ALL = "__all__";

type FormState = {
  id?: string;
  titulo: string;
  tipo: string;
  status: string;
  cliente_id: string;
  url_arquivo: string;
  valor: string;
  data_emissao: string;
  data_vencimento: string;
  emissor_documento: string;
  observacoes: string;
};

const emptyForm: FormState = {
  titulo: "",
  tipo: "outros",
  status: "pendente",
  cliente_id: "",
  url_arquivo: "",
  valor: "",
  data_emissao: "",
  data_vencimento: "",
  emissor_documento: "",
  observacoes: "",
};

function formatMoeda(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(v: string | null): string {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  if (!y || !m || !d) return v;
  return `${d}/${m}/${y}`;
}

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listarDocumentos);
  const listClientesFn = useServerFn(listMeusClientes);
  const upsertFn = useServerFn(upsertDocumento);
  const deleteFn = useServerFn(deletarDocumento);

  const [filtroTipo, setFiltroTipo] = useState<string>(ALL);
  const [filtroStatus, setFiltroStatus] = useState<string>(ALL);
  const [filtroCliente, setFiltroCliente] = useState<string>(ALL);
  const [busca, setBusca] = useState("");

  const filtroPayload = useMemo(
    () => ({
      tipo: filtroTipo !== ALL ? filtroTipo : undefined,
      status: filtroStatus !== ALL ? filtroStatus : undefined,
      cliente_id: filtroCliente !== ALL ? filtroCliente : undefined,
      busca: busca.trim() || undefined,
    }),
    [filtroTipo, filtroStatus, filtroCliente, busca],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["documentos", filtroPayload],
    queryFn: () => listFn({ data: filtroPayload }),
  });
  const rows = (data ?? []) as unknown as Row[];

  const { data: clientes } = useQuery({
    queryKey: ["meus-clientes"],
    queryFn: () => listClientesFn(),
  });
  const clientesList = (clientes ?? []) as unknown as Cliente[];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleting, setDeleting] = useState<Row | null>(null);

  function openNovo() {
    setForm(emptyForm);
    setOpen(true);
  }
  function openEditar(r: Row) {
    setForm({
      id: r.id,
      titulo: r.titulo,
      tipo: r.tipo,
      status: r.status,
      cliente_id: r.cliente_id ?? "",
      url_arquivo: r.url_arquivo ?? "",
      valor: r.valor !== null ? String(r.valor) : "",
      data_emissao: r.data_emissao ?? "",
      data_vencimento: r.data_vencimento ?? "",
      emissor_documento: r.emissor_documento ?? "",
      observacoes: r.observacoes ?? "",
    });
    setOpen(true);
  }

  const upsertMut = useMutation({
    mutationFn: (payload: FormState) =>
      upsertFn({
        data: {
          id: payload.id,
          titulo: payload.titulo.trim(),
          tipo: payload.tipo as (typeof TIPOS_DOCUMENTO)[number],
          status: payload.status as (typeof STATUS_DOCUMENTO)[number],
          cliente_id: payload.cliente_id || null,
          url_arquivo: payload.url_arquivo.trim() || null,
          valor: payload.valor.trim() || null,
          data_emissao: payload.data_emissao || null,
          data_vencimento: payload.data_vencimento || null,
          emissor_documento: payload.emissor_documento.trim() || null,
          observacoes: payload.observacoes.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Documento atualizado" : "Documento criado");
      qc.invalidateQueries({ queryKey: ["documentos"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Documento excluído");
      qc.invalidateQueries({ queryKey: ["documentos"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo de documentos fiscais e financeiros dos seus clientes.
          </p>
        </div>
        <Button onClick={openNovo}>
          <Plus className="mr-2 h-4 w-4" /> Novo documento
        </Button>
      </div>

      {/* Filtros */}
      <div className="mt-6 grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-4">
        <div>
          <Label className="text-xs">Buscar título</Label>
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex: NF 1234" />
        </div>
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {TIPOS_DOCUMENTO.map((t) => (
                <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {STATUS_DOCUMENTO.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Cliente</Label>
          <Select value={filtroCliente} onValueChange={setFiltroCliente}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {clientesList.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista */}
      <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhum documento encontrado.</div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.titulo}</div>
                      {r.emissor_documento && (
                        <div className="text-xs text-muted-foreground">{r.emissor_documento}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{TIPO_LABEL[r.tipo] ?? r.tipo}</td>
                    <td className="px-4 py-3">{r.clientes?.nome ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{formatMoeda(r.valor)}</td>
                    <td className="px-4 py-3">{formatDate(r.data_vencimento)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={STATUS_LABEL[r.status] ?? r.status}
                        variant={documentoStatusVariant(r.status)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {r.url_arquivo && (
                          <Button asChild size="icon" variant="ghost" title="Abrir arquivo">
                            <a href={r.url_arquivo} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => openEditar(r)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleting(r)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog Novo/Editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar documento" : "Novo documento"}</DialogTitle>
            <DialogDescription>
              Cole o link do arquivo hospedado no drive (Google Drive, OneDrive etc).
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              upsertMut.mutate(form);
            }}
          >
            <div className="md:col-span-2">
              <Label>Título *</Label>
              <Input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                maxLength={200}
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_DOCUMENTO.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Cliente</Label>
              <Select
                value={form.cliente_id || NONE}
                onValueChange={(v) => setForm({ ...form, cliente_id: v === NONE ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem cliente</SelectItem>
                  {clientesList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>URL do arquivo</Label>
              <Input
                type="url"
                placeholder="https://drive.google.com/..."
                value={form.url_arquivo}
                onChange={(e) => setForm({ ...form, url_arquivo: e.target.value })}
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </div>
            <div>
              <Label>Emissor (CNPJ/CPF ou nome)</Label>
              <Input
                value={form.emissor_documento}
                onChange={(e) => setForm({ ...form, emissor_documento: e.target.value })}
                maxLength={200}
              />
            </div>
            <div>
              <Label>Data de emissão</Label>
              <Input
                type="date"
                value={form.data_emissao}
                onChange={(e) => setForm({ ...form, data_emissao: e.target.value })}
              />
            </div>
            <div>
              <Label>Data de vencimento</Label>
              <Input
                type="date"
                value={form.data_vencimento}
                onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                maxLength={2000}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertMut.isPending}>
                {upsertMut.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o registro de "{deleting?.titulo}".
              O arquivo original no drive não é afetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMut.mutate(deleting.id)}
              disabled={deleteMut.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}