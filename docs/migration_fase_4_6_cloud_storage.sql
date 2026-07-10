-- ============================================
-- FASE 1.6: Cloud Storage Agnóstico
-- ============================================

-- ✅ ADICIONAR colunas em clientes
ALTER TABLE clientes ADD COLUMN (
    storage_tipo VARCHAR(50) DEFAULT 'google_drive',
    storage_config JSONB,
    storage_webhook_url TEXT
);

-- ✅ ADICIONAR constraint
ALTER TABLE clientes
ADD CONSTRAINT check_storage_tipo
CHECK (storage_tipo IN ('google_drive', 'onedrive', 'dropbox', 's3', 'azure_blob'));

-- ✅ ADICIONAR índice para performance
CREATE INDEX idx_clientes_storage_tipo ON clientes(storage_tipo);
