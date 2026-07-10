-- ============================================
-- FASE 1.5: Adicionar valor em itens_assinatura
-- ============================================

-- ✅ ADICIONAR coluna
ALTER TABLE itens_assinatura
ADD COLUMN valor NUMERIC(10, 2) DEFAULT 0;

-- ✅ ATUALIZAR função agregar_financeiro()
DROP FUNCTION IF EXISTS agregar_financeiro(uuid, date, date);

CREATE OR REPLACE FUNCTION agregar_financeiro(
    p_empresa_id UUID,
    p_data_inicio DATE DEFAULT NULL::date,
    p_data_fim DATE DEFAULT NULL::date
)
RETURNS JSON AS $$
DECLARE
    v_inicio DATE := COALESCE(p_data_inicio, DATE '1900-01-01');
    v_fim DATE := COALESCE(p_data_fim, DATE '2999-12-31');
    v_total_documentos BIGINT;
    v_total_valor NUMERIC;
    v_por_status JSON;
    v_por_tipo JSON;
    v_mrr_estimado NUMERIC;
    v_documentos_30d BIGINT;
BEGIN
    -- Total de documentos no período
    SELECT COUNT(*)::BIGINT INTO v_total_documentos
    FROM public.documentos d
    WHERE d.empresa_id = p_empresa_id
    AND COALESCE(d.data_emissao, d.criado_em::DATE) BETWEEN v_inicio AND v_fim;

    -- Soma total do valor no período
    SELECT COALESCE(SUM(d.valor), 0)::NUMERIC INTO v_total_valor
    FROM public.documentos d
    WHERE d.empresa_id = p_empresa_id
    AND COALESCE(d.data_emissao, d.criado_em::DATE) BETWEEN v_inicio AND v_fim;

    -- Agregação por status
    SELECT COALESCE(json_agg(json_build_object(
        'status', d.status,
        'quantidade', COUNT(*)::BIGINT,
        'valor_total', COALESCE(SUM(d.valor), 0)::NUMERIC
    )), '[]'::json) INTO v_por_status
    FROM public.documentos d
    WHERE d.empresa_id = p_empresa_id
    AND COALESCE(d.data_emissao, d.criado_em::DATE) BETWEEN v_inicio AND v_fim
    GROUP BY d.status
    ORDER BY d.status;

    -- Agregação por tipo
    SELECT COALESCE(json_agg(json_build_object(
        'tipo', d.tipo,
        'quantidade', COUNT(*)::BIGINT,
        'valor_total', COALESCE(SUM(d.valor), 0)::NUMERIC
    )), '[]'::json) INTO v_por_tipo
    FROM public.documentos d
    WHERE d.empresa_id = p_empresa_id
    AND COALESCE(d.data_emissao, d.criado_em::DATE) BETWEEN v_inicio AND v_fim
    GROUP BY d.tipo
    ORDER BY d.tipo;

    -- MRR estimado: soma dos valores de itens_assinatura vinculados a assinaturas ativas
    SELECT COALESCE(SUM(ia.valor), 0)::NUMERIC INTO v_mrr_estimado
    FROM public.itens_assinatura ia
    INNER JOIN public.assinaturas a ON a.id = ia.assinatura_id
    WHERE a.empresa_id = p_empresa_id
    AND a.status = 'ativa';

    -- Documentos nos últimos 30 dias
    SELECT COUNT(*)::BIGINT INTO v_documentos_30d
    FROM public.documentos d
    WHERE d.empresa_id = p_empresa_id
    AND COALESCE(d.data_emissao, d.criado_em::DATE) >= (CURRENT_DATE - INTERVAL '30 days')::DATE;

    RETURN json_build_object(
        'total_documentos', COALESCE(v_total_documentos, 0),
        'total_valor', COALESCE(v_total_valor, 0),
        'por_status', COALESCE(v_por_status, '[]'::json),
        'por_tipo', COALESCE(v_por_tipo, '[]'::json),
        'mrr_estimado', COALESCE(v_mrr_estimado, 0),
        'documentos_30d', COALESCE(v_documentos_30d, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
