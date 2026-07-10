-- ============================================
-- FASE 1.4: Corrigir tem_papel_empresa()
-- ============================================

-- ✅ Corrigir função via CREATE OR REPLACE (mesma assinatura e mesmos nomes
-- de parâmetros da versão anterior — não podemos DROP porque várias policies
-- dependem dela; DROP CASCADE derrubaria essas policies).
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
