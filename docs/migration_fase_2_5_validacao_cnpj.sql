-- ============================================
-- FASE 2.5: Validação de CNPJ
-- ============================================

-- ✅ Função de validação de CNPJ
CREATE OR REPLACE FUNCTION validar_cnpj(p_cnpj TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_cnpj_limpo TEXT;
    v_digito1 INT;
    v_digito2 INT;
    v_soma INT;
    v_resto INT;
    i INT;
BEGIN
    -- Remover caracteres especiais
    v_cnpj_limpo := regexp_replace(p_cnpj, '[^0-9]', '', 'g');

    -- Validar comprimento
    IF LENGTH(v_cnpj_limpo) != 14 THEN
        RETURN false;
    END IF;

    -- Validar se não é sequência repetida
    IF v_cnpj_limpo ~ '^([0-9])\1{13}$' THEN
        RETURN false;
    END IF;

    -- Calcular primeiro dígito
    v_soma := 0;
    FOR i IN 1..12 LOOP
        v_soma := v_soma + (SUBSTRING(v_cnpj_limpo, i, 1)::INT * ((13 - i) % 10 + 1));
    END LOOP;
    v_resto := v_soma % 11;
    v_digito1 := CASE WHEN v_resto < 2 THEN 0 ELSE 11 - v_resto END;

    -- Calcular segundo dígito
    v_soma := 0;
    FOR i IN 1..13 LOOP
        v_soma := v_soma + (SUBSTRING(v_cnpj_limpo, i, 1)::INT * ((14 - i) % 10 + 1));
    END LOOP;
    v_resto := v_soma % 11;
    v_digito2 := CASE WHEN v_resto < 2 THEN 0 ELSE 11 - v_resto END;

    -- Validar dígitos
    RETURN (SUBSTRING(v_cnpj_limpo, 13, 1)::INT = v_digito1)
        AND (SUBSTRING(v_cnpj_limpo, 14, 1)::INT = v_digito2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ✅ Adicionar constraint em empresas
ALTER TABLE empresas
ADD CONSTRAINT check_cnpj_valido
CHECK (cnpj IS NULL OR validar_cnpj(cnpj));

-- ✅ Adicionar constraint em clientes
ALTER TABLE clientes
ADD CONSTRAINT check_cnpj_valido
CHECK (cnpj IS NULL OR validar_cnpj(cnpj));
