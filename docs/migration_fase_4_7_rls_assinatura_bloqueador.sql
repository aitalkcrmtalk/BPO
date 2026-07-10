-- ============================================
-- FASE 1.7: Políticas RLS com Assinatura como Bloqueador
-- ============================================

-- ✅ EMPRESAS: bloqueado sem assinatura
DROP POLICY IF EXISTS "empresas_select" ON empresas;

CREATE POLICY "empresas_select" ON empresas
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM perfis p
        WHERE p.usuario_id = auth.uid()
        AND p.empresa_id = empresas.id
    )
    AND
    EXISTS (
        SELECT 1 FROM assinaturas a
        WHERE a.empresa_id = empresas.id
        AND a.status = 'ativa'
    )
);

-- ✅ CLIENTES: bloqueado sem assinatura
DROP POLICY IF EXISTS "clientes_select" ON clientes;

CREATE POLICY "clientes_select" ON clientes
FOR SELECT
USING (
    EXISTS (
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

-- ✅ DOCUMENTOS: bloqueado sem assinatura
DROP POLICY IF EXISTS "documentos_select" ON documentos;

CREATE POLICY "documentos_select" ON documentos
FOR SELECT
USING (
    EXISTS (
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

-- ✅ ITENS_ASSINATURA: bloqueado sem assinatura
DROP POLICY IF EXISTS "itens_assinatura_select" ON itens_assinatura;

CREATE POLICY "itens_assinatura_select" ON itens_assinatura
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assinaturas a
        WHERE a.id = itens_assinatura.assinatura_id
        AND a.status = 'ativa'
        AND EXISTS (
            SELECT 1 FROM perfis p
            WHERE p.usuario_id = auth.uid()
            AND p.empresa_id = a.empresa_id
        )
    )
);
