-- =============================================================================
-- Fase 4.3 — Validar papéis em perfis + restringir INSERT em clientes/documentos
-- Idempotente.
-- =============================================================================
BEGIN;

-- 1) Constraint de papéis válidos em perfis.
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS check_papel;
ALTER TABLE public.perfis
  ADD CONSTRAINT check_papel
  CHECK (papel IN ('super_admin', 'admin', 'usuario'));

-- 2) clientes — INSERT somente admin da empresa OU super_admin.
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT
  WITH CHECK (
    (empresa_id = public.get_empresa_do_usuario())
    AND (
      public.tem_papel_empresa(auth.uid(), empresa_id, 'admin')
      OR public.is_super_admin()
    )
  );

-- 3) documentos — INSERT somente admin da empresa OU super_admin.
--    (Documentos são criados via workflow n8n; o service_role continua bypassando RLS.)
DROP POLICY IF EXISTS "documentos_insert" ON public.documentos;
CREATE POLICY "documentos_insert" ON public.documentos
  FOR INSERT
  WITH CHECK (
    (empresa_id = public.get_empresa_do_usuario())
    AND (
      public.tem_papel_empresa(auth.uid(), empresa_id, 'admin')
      OR public.is_super_admin()
    )
  );

COMMIT;
-- =============================================================================