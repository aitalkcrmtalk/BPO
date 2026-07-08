import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Building2 } from "lucide-react";
import logoAsset from "@/assets/crm-talk-logo.png.asset.json";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
] as const;

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-primary text-primary-foreground md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-primary-foreground/10 px-4">
        <img src={logoAsset.url} alt="CRM Talk" className="h-8 w-8 rounded-md object-cover" />
        <div>
          <div className="text-sm font-semibold leading-tight">CRM Talk</div>
          <div className="text-[10px] uppercase tracking-wider text-primary-foreground/60">Super Admin</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4 text-sm">
        {items.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary-foreground/80 transition hover:bg-primary-foreground/10 hover:text-primary-foreground" activeProps={{ className: "bg-primary-foreground/15 text-primary-foreground" }}>
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}