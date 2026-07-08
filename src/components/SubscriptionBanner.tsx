import { AlertCircle, AlertTriangle } from "lucide-react";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

export function SubscriptionBanner() {
  const { status, warning, readOnly, blocking } = useSubscriptionGuard();
  if (!status || status === "active" || status === "trialing") return null;
  if (readOnly) {
    return (
      <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" /> Assinatura cancelada — acesso em modo leitura.
      </div>
    );
  }
  if (blocking) {
    return (
      <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" /> Pagamento incompleto — finalize sua assinatura.
      </div>
    );
  }
  if (warning) {
    return (
      <div className="flex items-center gap-2 border-b border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-4 py-2 text-sm text-foreground">
        <AlertTriangle className="h-4 w-4" /> Fatura em atraso. Regularize para não perder acesso.
      </div>
    );
  }
  return null;
}