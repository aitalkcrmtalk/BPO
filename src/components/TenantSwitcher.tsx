import { Building2 } from "lucide-react";
import { useTenantContext } from "@/hooks/useTenantContext";

export function TenantSwitcher() {
  const { data } = useTenantContext();
  const empresa = data?.empresa;
  if (!empresa) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <span className="max-w-[200px] truncate font-medium">{empresa.nome}</span>
    </div>
  );
}