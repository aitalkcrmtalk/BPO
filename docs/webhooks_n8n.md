# Webhooks n8n — Processamento de Documentos

## Webhook 1: Receber Documento do Cloud Storage
- **Endpoint:** `/webhook/processar-documento`
- **Payload:**
  ```json
  {
    "cliente_id": "uuid",
    "empresa_id": "uuid",
    "arquivo_url": "string",
    "arquivo_tipo": "string",
    "storage_tipo": "google_drive | onedrive | dropbox | s3 | azure_blob"
  }
  ```
- **Ação:** chamar RPC `processar_documento_cloud()` para criar o registro em `documentos` com status `em_processamento`.

## Webhook 2: Processar com OpenAI Vision
- **Endpoint:** `/webhook/extrair-dados-documento`
- **Payload:**
  ```json
  {
    "documento_id": "uuid",
    "arquivo_url": "string",
    "arquivo_tipo": "string",
    "storage_tipo": "google_drive | onedrive | dropbox | s3 | azure_blob"
  }
  ```
- **Processamento:** OpenAI Vision extrai dados estruturados (tipo, valor, data_emissao, data_vencimento, emissor, etc.).
- **Ação:** chamar RPC `atualizar_documento_processado()` para gravar `metadados` (JSONB) e definir status como `concluido` ou `erro`.

## Webhook 3: Notificar Admin em caso de Erro
- **Trigger:** `documento.status = 'erro'`
- **Ação:** enviar e-mail para `admin@empresa.com` com:
  - `documento_id`
  - `cliente_id` / `empresa_id`
  - `arquivo_url`
  - mensagem de erro (`metadados.erro`)