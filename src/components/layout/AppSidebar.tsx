import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CreditCard,
  UserCog,
  BarChart3,
  Zap,
} from "lucide-react";
import logoAsset from "@/assets/crm-talk-logo.png.asset.json";

const items = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/clientes", label: "Clientes", icon: Users },
  { to: "/app/documentos", label: "Documentos", icon: FileText },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/app/automacoes", label: "Automações", icon: Zap },
  { to: "/app/usuarios", label: "Usuários", icon: UserCog },
  { to: "/app/assinatura", label: "Assinatura", icon: CreditCard },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-primary text-primary-foreground md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-primary-foreground/10 px-4">
        <img src={logoAsset.url} alt="CRM Talk" className="h-8 w-8 rounded-md object-cover" />
        <span className="font-semibold">CRM Talk</span>
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