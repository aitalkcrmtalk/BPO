import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMeusDocumentos } from "@/lib/empresa-data.functions";
import { StatusBadge, documentoStatusVariant } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/app/documentos")({ component: Page });

type Row = {
  id: string;
  titulo: string;
  status: string;
  criado_em: string;
  url_arquivo: string | null;
  clientes: { id: string; nome: string } | null;
};

function Page() {
  const listFn = useServerFn(listMeusDocumentos);
  const { data, isLoading } = useQuery({ queryKey: ["meus-documentos"], queryFn: () => listFn() });
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div>
      <h1 className="text-2xl font-bold">Documentos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Upload + IA chegam na Fase 2.</p>
      <div className="mt-6 rounded-xl border bg-card shadow-sm">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhum documento ainda.</div>
        )}
        {rows.map((d) => (
          <div key={d.id} className="flex items-center justify-between border-b px-6 py-4 last:border-b-0">
            <div>
              <div className="font-semibold">{d.titulo}</div>
              <div className="text-xs text-muted-foreground">
                {d.clientes?.nome ?? "—"} · {new Date(d.criado_em).toLocaleString("pt-BR")}
              </div>
            </div>
            <StatusBadge label={d.status} variant={documentoStatusVariant(d.status)} />
          </div>
        ))}
      </div>
    </div>
  );
}