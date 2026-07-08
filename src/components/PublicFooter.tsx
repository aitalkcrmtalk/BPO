export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Projeto-BPO. Todos os direitos reservados.
      </div>
    </footer>
  );
}