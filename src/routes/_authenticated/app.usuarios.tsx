import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { StatusBadge } from "@/components/StatusBadge";
import {
  listUsuariosDaEmpresa,
  convidarUsuario,
  atualizarUsuario,
} from "@/lib/usuarios.functions";
import { listMeusClientes } from "@/lib/empresa-data.functions";

type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  usuarios_clientes: { cliente_id: string }[];
};
type ClienteRow = { id: string; nome: string };

export const Route = createFileRoute("/_authenticated/app/usuarios")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listUsuariosDaEmpresa);
  const clientesFn = useServerFn(listMeusClientes);
  const convidarFn = useServerFn(convidarUsuario);
  const atualizarFn = useServerFn(atualizarUsuario);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios-empresa"],
    queryFn: () => listFn() as Promise<UsuarioRow[]>,
  });
  const { data: clientes = [] } = useQuery({
    queryKey: ["meus-clientes-select"],
    queryFn: () => clientesFn() as Promise<ClienteRow[]>,
  });

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<UsuarioRow | null>(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    papel: "usuario" as "admin" | "usuario",
    clientes_ids: [] as string[],
  });

  function openNovo() {
    setEditando(null);
    setForm({ nome: "", email: "", papel: "usuario", clientes_ids: [] });
    setOpen(true);
  }
  function openEdit(u: UsuarioRow) {
    setEditando(u);
    setForm({
      nome: u.nome,
      email: u.email,
      papel: (u.papel as "admin" | "usuario") ?? "usuario",
      clientes_ids: u.usuarios_clientes?.map((v) => v.cliente_id) ?? [],
    });
    setOpen(true);
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (editando) {
        return atualizarFn({
          data: {
            perfil_id: editando.id,
            papel: form.papel,
            clientes_ids: form.papel === "usuario" ? form.clientes_ids : [],
          },
        });
      }
      return convidarFn({ data: form });
    },
    onSuccess: () => {
      toast.success(editando ? "Usuário atualizado" : "Convite enviado");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["usuarios-empresa"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleAtivo = useMutation({
    mutationFn: (u: UsuarioRow) =>
      atualizarFn({ data: { perfil_id: u.id, ativo: !u.ativo } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios-empresa"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Button onClick={openNovo}>Convidar usuário</Button>
      </div>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {usuarios.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between border-b px-6 py-4 last:border-b-0"
          >
            <div className="min-w-0">
              <div className="font-semibold">{u.nome}</div>
              <div className="text-xs text-muted-foreground">
                {u.email} · {u.usuarios_clientes?.length ?? 0} cliente(s) vinculado(s)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                label={u.papel}
                variant={u.papel === "admin" ? "info" : "muted"}
              />
              <StatusBadge
                label={u.ativo ? "ativo" : "inativo"}
                variant={u.ativo ? "success" : "destructive"}
              />
              <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant={u.ativo ? "outline" : "default"}
                onClick={() => toggleAtivo.mutate(u)}
              >
                {u.ativo ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && usuarios.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhum usuário</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuário" : "Convidar usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editando && (
              <>
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div>
              <Label>Papel</Label>
              <Select
                value={form.papel}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, papel: v as "admin" | "usuario" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.papel === "usuario" && (
              <div>
                <Label>Clientes permitidos</Label>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {clientes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum cliente cadastrado.
                    </p>
                  )}
                  {clientes.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.clientes_ids.includes(c.id)}
                        onCheckedChange={(ck) =>
                          setForm((f) => ({
                            ...f,
                            clientes_ids: ck
                              ? [...f.clientes_ids, c.id]
                              : f.clientes_ids.filter((x) => x !== c.id),
                          }))
                        }
                      />
                      {c.nome}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
              {editando ? "Salvar" : "Enviar convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}