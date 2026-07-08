import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useTenantContext } from "@/hooks/useTenantContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function TenantSwitcher() {
  const { data } = useTenantContext();
  const active = data?.tenant;
  const tenants = data?.tenants ?? [];
  if (!active) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[160px] truncate">{active.name}</span>
          <ChevronsUpDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Seus tenants</DropdownMenuLabel>
        {tenants.map((t) => (
          <DropdownMenuItem key={t.id} className="flex items-center justify-between">
            <span className="truncate">{t.name}</span>
            {t.id === active.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}