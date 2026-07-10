-- ============================================
-- FASE 1.6: Cloud Storage Agnóstico
-- ============================================

-- ✅ ADICIONAR colunas em clientes (Postgres usa ADD COLUMN por coluna)
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS storage_tipo VARCHAR(50) DEFAULT 'google_drive',
    ADD COLUMN IF NOT EXISTS storage_config JSONB,
    ADD COLUMN IF NOT EXISTS storage_webhook_url TEXT;

-- ✅ ADICIONAR constraint
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS check_storage_tipo;
ALTER TABLE clientes
ADD CONSTRAINT check_storage_tipo
CHECK (storage_tipo IN ('google_drive', 'onedrive', 'dropbox', 's3', 'azure_blob'));

-- ✅ ADICIONAR índice para performance
CREATE INDEX IF NOT EXISTS idx_clientes_storage_tipo ON clientes(storage_tipo);
