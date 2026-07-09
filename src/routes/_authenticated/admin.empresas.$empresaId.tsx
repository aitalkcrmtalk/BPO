import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, empresaAtivaVariant } from "@/components/StatusBadge";
import { getEmpresaDetalhes } from "@/lib/admin.functions";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/empresas/$empresaId")({
  component: EmpresaPerfilPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Empresa não encontrada.</div>,
});

function EmpresaPerfilPage() {
  const { empresaId } = Route.useParams();
  const fn = useServerFn(getEmpresaDetalhes);
  const { data, isLoading } = useQuery({
    queryKey: ["empresa-detalhes", empresaId],
    queryFn: () => fn({ data: { empresa_id: empresaId } }),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando…</div>;
  if (!data) return null;

  const { empresa, assinatura, usuarios, stats } = data;
  const itens = (assinatura?.itens_assinatura ?? []) as Array<{
    ativo: boolean;
    modulos: { id: string; nome: string; valor_base: number | null } | null;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/empresas"><ArrowLeft className="mr-1 h-4 w-4" /> Empresas</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{empresa.nome}</h1>
            <StatusBadge label={empresa.ativo ? "ativa" : "inativa"} variant={empresaAtivaVariant(empresa.ativo)} />
          </div>
        </div>
      </div>

      {/* Dados cadastrais */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Dados cadastrais</h2>
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <Info label="Razão social" value={empresa.razao_social} />
          <Info label="CNPJ" value={empresa.cnpj} />
          <Info label="E-mail" value={empresa.email} />
          <Info label="Telefone" value={empresa.telefone} />
          <Info label="Criada em" value={formatDate(empresa.criado_em)} />
          <Info label="Atualizada em" value={formatDateTime(empresa.atualizado_em)} />
        </dl>
      </section>

      {/* Estatísticas */}
      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="Usuários" value={stats.totalUsuarios} />
        <Stat label="Clientes" value={stats.totalClientes} />
        <Stat label="Documentos" value={stats.totalDocumentos} />
        <Stat label="Docs (30d)" value={stats.documentos30d} />
      </section>

      {/* Assinatura */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Assinatura</h2>
        {!assinatura ? (
          <p className="text-sm text-muted-foreground">Nenhuma assinatura cadastrada.</p>
        ) : (
          <>
            <dl className="grid gap-4 text-sm md:grid-cols-3">
              <Info label="Status" value={assinatura.status} />
              <Info label="Plano" value={assinatura.plano} />
              <Info label="Valor base" value={formatBRL(assinatura.valor_base)} />
            </dl>
            <h3 className="mt-6 mb-2 text-sm font-semibold">Módulos contratados</h3>
            <div className="divide-y rounded-md border">
              {itens.filter((i) => i.ativo && i.modulos).map((i) => (
                <div key={i.modulos!.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{i.modulos!.nome}</span>
                  <span className="text-muted-foreground">{formatBRL(i.modulos!.valor_base ?? 0)}</span>
                </div>
              ))}
              {itens.filter((i) => i.ativo).length === 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground">Nenhum módulo ativo.</p>
              )}
            </div>
          </>
        )}
      </section>

      {/* Usuários */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Usuários ({usuarios.length})</h2>
        {usuarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{u.nome ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-md border px-2 py-0.5 capitalize">{u.papel ?? "—"}</span>
                  <StatusBadge label={u.ativo ? "ativo" : "inativo"} variant={empresaAtivaVariant(!!u.ativo)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value ?? "—"}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}