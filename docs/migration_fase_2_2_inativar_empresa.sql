-- ============================================
-- FASE 2.2: RPC inativar_empresa() com Cascata
-- ============================================

CREATE OR REPLACE FUNCTION inativar_empresa(p_empresa_id UUID)
RETURNS JSON AS $$
DECLARE
    v_clientes_inativados INT;
    v_documentos_inativados INT;
    v_assinaturas_inativadas INT;
BEGIN
    -- Validação: super_admin only
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Apenas super_admin pode inativar empresa';
    END IF;

    -- Inativar clientes
    UPDATE clientes
    SET ativo = false
    WHERE empresa_id = p_empresa_id;
    GET DIAGNOSTICS v_clientes_inativados = ROW_COUNT;

    -- Inativar documentos
    UPDATE documentos
    SET ativo = false
    WHERE empresa_id = p_empresa_id;
    GET DIAGNOSTICS v_documentos_inativados = ROW_COUNT;

    -- Inativar assinaturas
    UPDATE assinaturas
    SET status = 'cancelada'
    WHERE empresa_id = p_empresa_id
    AND status = 'ativa';
    GET DIAGNOSTICS v_assinaturas_inativadas = ROW_COUNT;

    -- Inativar empresa
    UPDATE empresas
    SET ativo = false
    WHERE id = p_empresa_id;

    RETURN json_build_object(
        'empresa_id', p_empresa_id,
        'clientes_inativados', v_clientes_inativados,
        'documentos_inativados', v_documentos_inativados,
        'assinaturas_inativadas', v_assinaturas_inativadas,
        'status', 'empresa inativada com cascata'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
