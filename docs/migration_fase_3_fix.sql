-- =============================================================================
-- Projeto-BPO | Fase 3 — Fix policies user_roles (recursão infinita)
-- Rodar DEPOIS de docs/migration_fase_3.sql
-- Idempotente.
-- =============================================================================
BEGIN;

-- 1) Garantir que user_roles tem RLS habilitado
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2) Derrubar QUALQUER policy existente em user_roles (evitar recursão)
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

-- 3) Função SECURITY DEFINER já deve existir (has_platform_role).
--    Recria de forma defensiva com search_path fixo.
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_platform_role(uuid, text) TO authenticated, anon;

-- 4) Grants mínimos (auth-only)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

-- 5) Policies sem auto-referência: cada usuário vê apenas as SUAS roles;
--    super_admin (via função) vê/gerencia tudo.
CREATE POLICY user_roles_select_self ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_roles_select_admin ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'));

CREATE POLICY user_roles_write_admin ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_platform_role(auth.uid(), 'super_admin'));

COMMIT;
-- =============================================================================