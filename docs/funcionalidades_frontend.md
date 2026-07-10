# Funcionalidades do Frontend

## Dashboard
- Agregação financeira via RPC `agregar_financeiro`
- KPIs: `total_documentos`, `total_valor`, `por_status`, `por_tipo`, `mrr_estimado`, `documentos_30d`
- Gráficos:
  - Linha (evolução no tempo)
  - Pizza (distribuição por status)
  - Barras (distribuição por tipo)

## Gestão de Clientes
- CRUD completo com RLS por empresa
- Configuração de storage: `storage_tipo`, `storage_webhook_url`, `storage_config`
- Validação de CNPJ (função `validar_cnpj`)

## Gestão de Assinaturas
- Criar assinatura (papel: admin)
- Selecionar plano: `Básico`, `Profissional`, `Enterprise`
- Selecionar período: 3, 6 ou 12 meses
- Visualizar status: `ativa`, `cancelada`, `expirada`, `suspensa`

## Visualização de Documentos
- Listar documentos por cliente
- Filtrar por status: `em_processamento`, `concluido`, `erro`, `rejeitado`
- Visualizar metadados extraídos (JSONB)
- Link para arquivo no cloud storage (`url_arquivo`)

## Relatórios
- Documentos processados por mês
- Taxa de sucesso (concluído vs erro)
- Tempo médio de processamento
- Documentos por cliente
- Documentos por tipo