-- ============================================================
-- FASE 2 — MIGRAÇÃO PROJETO-BPO (SUPABASE)
-- Adiciona campos fiscais em documentos + índices
-- Idempotente
-- ============================================================

BEGIN;

-- ----------------------------------------------------------
-- 1. Novas colunas em documentos
-- ----------------------------------------------------------
ALTER TABLE public.documentos
    ADD COLUMN IF NOT EXISTS tipo               TEXT NOT NULL DEFAULT 'outro',
    ADD COLUMN IF NOT EXISTS valor              NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS data_emissao       DATE,
    ADD COLUMN IF NOT EXISTS data_vencimento    DATE,
    ADD COLUMN IF NOT EXISTS emissor_documento  TEXT,
    ADD COLUMN IF NOT EXISTS observacoes        TEXT,
    ADD COLUMN IF NOT EXISTS atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ----------------------------------------------------------
-- 2. CHECK constraints (tipo e status)
-- ----------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'documentos_tipo_check'
    ) THEN
        ALTER TABLE public.documentos
            ADD CONSTRAINT documentos_tipo_check
            CHECK (tipo IN ('nfe','nfse','boleto','extrato','outro'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'documentos_status_check'
    ) THEN
        ALTER TABLE public.documentos
            ADD CONSTRAINT documentos_status_check
            CHECK (status IN ('pendente','em_processamento','processado','erro','arquivado'));
    END IF;
END $$;

-- ----------------------------------------------------------
-- 3. Índices
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS documentos_empresa_idx        ON public.documentos (empresa_id);
CREATE INDEX IF NOT EXISTS documentos_cliente_idx        ON public.documentos (cliente_id);
CREATE INDEX IF NOT EXISTS documentos_tipo_idx           ON public.documentos (tipo);
CREATE INDEX IF NOT EXISTS documentos_status_idx         ON public.documentos (status);
CREATE INDEX IF NOT EXISTS documentos_vencimento_idx     ON public.documentos (data_vencimento);

-- ----------------------------------------------------------
-- 4. Trigger para atualizado_em
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documentos_set_atualizado_em ON public.documentos;
CREATE TRIGGER documentos_set_atualizado_em
    BEFORE UPDATE ON public.documentos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_atualizado_em();

COMMIT;

-- ============================================================
-- FIM DO SCRIPT FASE 2
-- ============================================================