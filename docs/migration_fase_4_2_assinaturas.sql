-- =============================================================================
-- Fase 4.2 — Permitir admin da empresa criar/atualizar assinaturas
-- Idempotente.
-- =============================================================================
BEGIN;

-- 0) Helpers auxiliares (garantia defensiva).
CREATE OR REPLACE FUNCTION public.tem_papel_empresa(_user_id uuid, _empresa_id uuid, _papel text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE id = _user_id
      AND empresa_id = _empresa_id
      AND papel = _papel
      AND ativo = true
  );
$$;
GRANT EXECUTE ON FUNCTION public.tem_papel_empresa(uuid, uuid, text) TO authenticated;

-- get_empresa_do_usuario já existe no schema (fase 1.5). Wrapper defensivo:
CREATE OR REPLACE FUNCTION public.get_empresa_do_usuario()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.perfis WHERE id = auth.uid() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_empresa_do_usuario() TO authenticated;

-- is_super_admin() já criada na Fase 4.1.

-- 1) INSERT — admin da empresa OU super_admin.
DROP POLICY IF EXISTS "assinaturas_insert" ON public.assinaturas;
CREATE POLICY "assinaturas_insert" ON public.assinaturas
  FOR INSERT
  WITH CHECK (
    (empresa_id = public.get_empresa_do_usuario())
    AND (
      public.tem_papel_empresa(auth.uid(), empresa_id, 'admin')
      OR public.is_super_admin()
    )
  );

-- 2) UPDATE — mesmas regras.
DROP POLICY IF EXISTS "assinaturas_update" ON public.assinaturas;
CREATE POLICY "assinaturas_update" ON public.assinaturas
  FOR UPDATE
  USING (
    (empresa_id = public.get_empresa_do_usuario())
    AND (
      public.tem_papel_empresa(auth.uid(), empresa_id, 'admin')
      OR public.is_super_admin()
    )
  )
  WITH CHECK (
    (empresa_id = public.get_empresa_do_usuario())
    AND (
      public.tem_papel_empresa(auth.uid(), empresa_id, 'admin')
      OR public.is_super_admin()
    )
  );

COMMIT;
-- =============================================================================