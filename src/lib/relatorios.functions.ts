import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getMinhaEmpresaId(supabase: AnyClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("perfis").select("empresa_id").eq("id", userId).maybeSingle();
  return (data?.empresa_id as string) ?? null;
}

const TIPOS_RECEBER = ["nota_fiscal", "comprovante"];
const TIPOS_PAGAR = ["boleto", "contrato"];

const inputSchema = z.object({
  inicio: z.string(),
  fim: z.string(),
});

export const getRelatorioFinanceiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as AnyClient;
    const empresaId = await getMinhaEmpresaId(supabase, context.userId);
    if (!empresaId) return { kpis: null, porTipo: [], porMes: [], atrasados: [] };

    const { data: agg, error } = await supabase.rpc("agregar_financeiro", {
      _empresa_id: empresaId,
      _inicio: data.inicio,
      _fim: data.fim,
    });
    if (error) throw new Error(error.message);

    const rows = (agg ?? []) as Array<{
      tipo: string;
      status: string;
      total_valor: number;
      quantidade: number;
    }>;

    let aReceber = 0;
    let aPagar = 0;
    let concluidos = 0;
    const porTipo: Record<string, number> = {};
    for (const r of rows) {
      const v = Number(r.total_valor ?? 0);
      porTipo[r.tipo] = (porTipo[r.tipo] ?? 0) + v;
      if (r.status === "concluido") concluidos += v;
      if (TIPOS_RECEBER.includes(r.tipo)) aReceber += v;
      if (TIPOS_PAGAR.includes(r.tipo)) aPagar += v;
    }

    // Documentos atrasados (top 20)
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: atrasados } = await supabase
      .from("documentos")
      .select("id, titulo, tipo, valor, data_vencimento, status, clientes:cliente_id(nome)")
      .eq("empresa_id", empresaId)
      .lt("data_vencimento", hoje)
      .neq("status", "concluido")
      .not("data_vencimento", "is", null)
      .order("data_vencimento", { ascending: true })
      .limit(20);

    // Série por mês (últimos 6) — pega documentos com data_vencimento no range.
    const { data: docsMes } = await supabase
      .from("documentos")
      .select("valor, tipo, data_vencimento")
      .eq("empresa_id", empresaId)
      .gte("data_vencimento", data.inicio)
      .lte("data_vencimento", data.fim)
      .not("data_vencimento", "is", null);

    const porMesMap: Record<string, { mes: string; receber: number; pagar: number }> = {};
    for (const d of (docsMes ?? []) as Array<{
      valor: number | null;
      tipo: string;
      data_vencimento: string;
    }>) {
      const mes = d.data_vencimento.slice(0, 7);
      if (!porMesMap[mes]) porMesMap[mes] = { mes, receber: 0, pagar: 0 };
      const v = Number(d.valor ?? 0);
      if (TIPOS_RECEBER.includes(d.tipo)) porMesMap[mes].receber += v;
      if (TIPOS_PAGAR.includes(d.tipo)) porMesMap[mes].pagar += v;
    }
    const porMes = Object.values(porMesMap).sort((a, b) => a.mes.localeCompare(b.mes));

    return {
      kpis: { aReceber, aPagar, concluidos, saldo: aReceber - aPagar },
      porTipo: Object.entries(porTipo).map(([tipo, valor]) => ({ tipo, valor })),
      porMes,
      atrasados: atrasados ?? [],
    };
  });