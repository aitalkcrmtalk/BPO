-- ============================================
-- FASE 2.3: documentos.atualizado_em NOT NULL
-- ============================================

-- ✅ ATUALIZAR registros existentes
UPDATE documentos
SET atualizado_em = COALESCE(atualizado_em, criado_em)
WHERE atualizado_em IS NULL;

-- ✅ ADICIONAR constraint
ALTER TABLE documentos
ALTER COLUMN atualizado_em SET NOT NULL,
ALTER COLUMN atualizado_em SET DEFAULT now();
