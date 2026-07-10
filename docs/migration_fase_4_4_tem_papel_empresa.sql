-- ============================================
-- FASE 1.4: Corrigir tem_papel_empresa()
-- ============================================

-- ❌ REMOVER função errada
DROP FUNCTION IF EXISTS tem_papel_empresa(uuid, uuid, text);

-- ✅ CRIAR função corrigida
CREATE OR REPLACE FUNCTION tem_papel_empresa(
    p_user_id UUID,
    p_empresa_id UUID,
    p_papel TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM perfis
        WHERE usuario_id = p_user_id
        AND empresa_id = p_empresa_id
        AND papel = p_papel
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
