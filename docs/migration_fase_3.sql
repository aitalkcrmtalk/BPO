-- =============================================================================
-- Projeto-BPO | Migração Fase 3 (idempotente)
-- Escopo: usuários/convites, webhooks n8n, relatórios, admin de planos
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. perfis.ativo  (para "desativar" um perfil sem remover de auth.users)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='perfis' AND column_name='ativo'
  ) THEN
    ALTER TABLE public.perfis ADD COLUMN ativo boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. assinaturas.status — normalizar valores permitidos
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='assinaturas_status_check') THEN
    ALTER TABLE public.assinaturas DROP CONSTRAINT assinaturas_status_check;
  END IF;
  ALTER TABLE public.assinaturas
    ADD CONSTRAINT assinaturas_status_check
    CHECK (status IN ('ativa','trial','suspensa','cancelada','atrasada','incompleta'));
END $$;

-- ---------------------------------------------------------------------------
-- 3. modulos.valor_base  (necessário para MRR e catálogo de planos)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='modulos' AND column_name='valor_base'
  ) THEN
    ALTER TABLE public.modulos ADD COLUMN valor_base numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. webhooks_empresa
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhooks_empresa (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  url          text NOT NULL,
  secret       text NOT NULL,
  ativo        boolean NOT NULL DEFAULT true,
  eventos      text[] NOT NULL DEFAULT ARRAY['documento.criado','documento.atualizado']::text[],
  criado_em    timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS webhooks_empresa_empresa_uniq
  ON public.webhooks_empresa(empresa_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks_empresa TO authenticated;
GRANT ALL ON public.webhooks_empresa TO service_role;

ALTER TABLE public.webhooks_empresa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhooks_empresa_select ON public.webhooks_empresa;
CREATE POLICY webhooks_empresa_select ON public.webhooks_empresa FOR SELECT TO authenticated
  USING (
    empresa_id = public.get_empresa_do_usuario(auth.uid())
    OR public.has_platform_role(auth.uid(),'super_admin')
  );

DROP POLICY IF EXISTS webhooks_empresa_write ON public.webhooks_empresa;
CREATE POLICY webhooks_empresa_write ON public.webhooks_empresa FOR ALL TO authenticated
  USING (
    empresa_id = public.get_empresa_do_usuario(auth.uid())
    OR public.has_platform_role(auth.uid(),'super_admin')
  )
  WITH CHECK (
    empresa_id = public.get_empresa_do_usuario(auth.uid())
    OR public.has_platform_role(auth.uid(),'super_admin')
  );

-- ---------------------------------------------------------------------------
-- 5. Índices para relatórios financeiros
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS documentos_empresa_venc_idx
  ON public.documentos(empresa_id, data_vencimento);
CREATE INDEX IF NOT EXISTS documentos_empresa_tipo_status_idx
  ON public.documentos(empresa_id, tipo, status);

-- ---------------------------------------------------------------------------
-- 6. Função agregadora financeira (SECURITY DEFINER, escopo empresa)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.agregar_financeiro(
  _empresa_id uuid,
  _inicio date,
  _fim date
) RETURNS TABLE (
  tipo text,
  status text,
  total_valor numeric,
  quantidade bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(d.tipo,'outros')            AS tipo,
    COALESCE(d.status,'pendente')        AS status,
    COALESCE(SUM(d.valor),0)::numeric    AS total_valor,
    COUNT(*)::bigint                     AS quantidade
  FROM public.documentos d
  WHERE d.empresa_id = _empresa_id
    AND (d.data_vencimento IS NULL OR d.data_vencimento BETWEEN _inicio AND _fim)
  GROUP BY 1, 2;
$$;

GRANT EXECUTE ON FUNCTION public.agregar_financeiro(uuid, date, date) TO authenticated;

COMMIT;

-- =============================================================================
-- Fim da Migração Fase 3
-- =============================================================================