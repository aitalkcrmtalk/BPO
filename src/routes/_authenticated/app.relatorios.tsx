import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL, formatDate } from "@/lib/format";
import { getRelatorioFinanceiro } from "@/lib/relatorios.functions";

export const Route = createFileRoute("/_authenticated/app/relatorios")({ component: Page });

function firstOfMonth(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}
function lastOfMonth(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset + 1);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
}

function Page() {
  const [inicio, setInicio] = useState(firstOfMonth(-5));
  const [fim, setFim] = useState(lastOfMonth(0));
  const fn = useServerFn(getRelatorioFinanceiro);

  const { data, isLoading } = useQuery({
    queryKey: ["relatorio", inicio, fim],
    queryFn: () => fn({ data: { inicio, fim } }),
  });

  const kpis = data?.kpis;
  const porMes = data?.porMes ?? [];
  const atrasados = data?.atrasados ?? [];

  const csv = useMemo(() => {
    const header = "tipo;total\n";
    const rows = (data?.porTipo ?? [])
      .map((r) => `${r.tipo};${Number(r.valor).toFixed(2).replace(".", ",")}`)
      .join("\n");
    return header + rows;
  }, [data]);

  function exportCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${inicio}_${fim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios financeiros</h1>
        <Button variant="outline" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div>
          <Label>Início</Label>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div>
          <Label>Fim</Label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "A receber", value: kpis?.aReceber ?? 0 },
          { label: "A pagar", value: kpis?.aPagar ?? 0 },
          { label: "Concluídos", value: kpis?.concluidos ?? 0 },
          { label: "Saldo", value: kpis?.saldo ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-2xl font-bold">{formatBRL(s.value)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Fluxo por mês</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Legend />
              <Bar dataKey="receber" fill="hsl(var(--primary))" name="A receber" />
              <Bar dataKey="pagar" fill="hsl(var(--destructive))" name="A pagar" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Atrasados</h2>
        {isLoading && <div className="text-muted-foreground">Carregando…</div>}
        {!isLoading && atrasados.length === 0 && (
          <div className="text-muted-foreground">Nenhum documento atrasado 🎉</div>
        )}
        <div className="divide-y">
          {atrasados.map((d: {
            id: string;
            titulo: string;
            tipo: string;
            valor: number | null;
            data_vencimento: string;
            clientes: { nome: string } | null;
          }) => (
            <div key={d.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{d.titulo}</div>
                <div className="text-xs text-muted-foreground">
                  {d.tipo} · {d.clientes?.nome ?? "sem cliente"} · venc.{" "}
                  {formatDate(d.data_vencimento)}
                </div>
              </div>
              <div className="font-semibold text-destructive">{formatBRL(d.valor)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}