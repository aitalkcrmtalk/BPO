-- =============================================================================
-- Fase 4.1 — Corrigir recursão RLS em user_roles
-- Idempotente.
-- =============================================================================
BEGIN;

-- 0) Garante função is_super_admin() (wrapper de has_platform_role).
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;

-- 1) Derruba QUALQUER policy existente em user_roles (evitar duplicidade/recursão).
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2) SELECT: cada usuário vê as próprias roles; super_admin vê tudo.
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT
  USING ((user_id = auth.uid()) OR public.is_super_admin());

-- 3) INSERT / UPDATE / DELETE: somente super_admin.
CREATE POLICY "user_roles_mutate" ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "user_roles_delete" ON public.user_roles
  FOR DELETE
  USING (public.is_super_admin());

COMMIT;
-- =============================================================================