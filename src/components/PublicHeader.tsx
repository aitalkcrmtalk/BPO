import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">BPO</span>
          </div>
          <span>Projeto-BPO</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#como-funciona" className="hover:text-foreground">Como funciona</a>
          <Link to="/planos" className="hover:text-foreground">Planos</Link>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/cadastro">
            <Button size="sm">Cadastrar</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}