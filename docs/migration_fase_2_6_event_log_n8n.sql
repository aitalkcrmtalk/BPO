-- ============================================
-- FASE 2.6: Event Log para n8n
-- ============================================

-- ✅ CRIAR tabela de eventos
CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    tabela VARCHAR(50) NOT NULL,
    operacao VARCHAR(10) NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id UUID NOT NULL,
    dados_antes JSONB,
    dados_depois JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ✅ GRANTs para acesso via Data API
GRANT SELECT, INSERT ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;

-- ✅ ADICIONAR índices (idempotente)
CREATE INDEX IF NOT EXISTS idx_eventos_empresa_id ON eventos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tabela ON eventos(tabela);
CREATE INDEX IF NOT EXISTS idx_eventos_operacao ON eventos(operacao);
CREATE INDEX IF NOT EXISTS idx_eventos_criado_em ON eventos(criado_em);

-- ✅ HABILITAR RLS
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- ✅ POLÍTICA RLS (idempotente)
DROP POLICY IF EXISTS "eventos_select_own_empresa" ON eventos;
CREATE POLICY "eventos_select_own_empresa" ON eventos
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM perfis p
        WHERE p.usuario_id = auth.uid()
        AND p.empresa_id = eventos.empresa_id
    )
    OR is_super_admin()
);

-- ✅ FUNÇÃO para registrar eventos
CREATE OR REPLACE FUNCTION registrar_evento(
    p_empresa_id UUID,
    p_tabela VARCHAR,
    p_operacao VARCHAR,
    p_registro_id UUID,
    p_dados_antes JSONB DEFAULT NULL,
    p_dados_depois JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_evento_id UUID;
BEGIN
    INSERT INTO eventos (
        empresa_id,
        tabela,
        operacao,
        registro_id,
        dados_antes,
        dados_depois,
        usuario_id
    )
    VALUES (
        p_empresa_id,
        p_tabela,
        p_operacao,
        p_registro_id,
        p_dados_antes,
        p_dados_depois,
        auth.uid()
    )
    RETURNING id INTO v_evento_id;

    RETURN v_evento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
