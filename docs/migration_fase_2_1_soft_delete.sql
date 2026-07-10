-- ============================================
-- FASE 2.1: Soft Delete com ativo BOOLEAN
-- ============================================

-- ✅ ADICIONAR coluna ativo em clientes
ALTER TABLE clientes
ADD COLUMN ativo BOOLEAN DEFAULT true;

-- ✅ ADICIONAR coluna ativo em documentos
ALTER TABLE documentos
ADD COLUMN ativo BOOLEAN DEFAULT true;

-- ✅ ATUALIZAR políticas RLS para filtrar por ativo
DROP POLICY IF EXISTS "clientes_select" ON clientes;

CREATE POLICY "clientes_select" ON clientes
FOR SELECT
USING (
    ativo = true
    AND EXISTS (
        SELECT 1 FROM perfis p
        WHERE p.usuario_id = auth.uid()
        AND p.empresa_id = clientes.empresa_id
    )
    AND
    EXISTS (
        SELECT 1 FROM assinaturas a
        WHERE a.empresa_id = clientes.empresa_id
        AND a.status = 'ativa'
    )
);

DROP POLICY IF EXISTS "documentos_select" ON documentos;

CREATE POLICY "documentos_select" ON documentos
FOR SELECT
USING (
    ativo = true
    AND EXISTS (
        SELECT 1 FROM perfis p
        WHERE p.usuario_id = auth.uid()
        AND p.empresa_id = documentos.empresa_id
    )
    AND
    EXISTS (
        SELECT 1 FROM assinaturas a
        WHERE a.empresa_id = documentos.empresa_id
        AND a.status = 'ativa'
    )
);
