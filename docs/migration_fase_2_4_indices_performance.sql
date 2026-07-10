-- ============================================
-- FASE 2.4: Índices de Performance
-- ============================================

-- ✅ Documentos
CREATE INDEX IF NOT EXISTS idx_documentos_empresa_status ON documentos(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_documentos_empresa_data_emissao ON documentos(empresa_id, data_emissao);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_id ON documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_status ON documentos(status);

-- ✅ Clientes
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);

-- ✅ Assinaturas
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_status ON assinaturas(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);

-- ✅ Perfis
CREATE INDEX IF NOT EXISTS idx_perfis_usuario_id ON perfis(usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfis_empresa_id ON perfis(empresa_id);

-- ✅ User Roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
