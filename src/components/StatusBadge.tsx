import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "destructive" | "muted" | "info";

const styles: Record<Variant, string> = {
  success: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200",
  destructive: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200",
  muted: "bg-muted text-muted-foreground border-border",
  info: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200",
};

export function StatusBadge({ label, variant = "muted", className }: { label: string; variant?: Variant; className?: string }) {
  return <Badge variant="outline" className={cn(styles[variant], className)}>{label}</Badge>;
}

export function tenantStatusVariant(status: string): Variant {
  return status === "approved" ? "success" : status === "pending" ? "warning" : status === "rejected" ? "destructive" : "muted";
}

export function subscriptionVariant(status: string): Variant {
  if (status === "active" || status === "trialing") return "success";
  if (status === "past_due" || status === "incomplete") return "warning";
  if (status === "canceled") return "destructive";
  return "muted";
}