# Fase 3+: Workflow n8n "BPO Agent"

Vou criar o workflow completo no seu n8n (projeto **BPO**), seguindo a arquitetura Lovable → n8n → OpenAI → Supabase que você descreveu, e integrá-lo aos webhooks/callback já existentes na Fase 3.

## Arquitetura do workflow

```text
[Webhook POST /bpo-agent]
       ↓
[Verify HMAC signature]        ← usa o mesmo secret salvo em webhooks_empresa
       ↓
[Query Supabase]               ← RAG: busca documentos da empresa_id
       ↓
[AI Agent — gpt-4o]            ← com tools MCP-style
   ├─ tool: search_documents   → Supabase SELECT
   ├─ tool: update_document    → Supabase UPDATE
   └─ tool: list_clientes      → Supabase SELECT
       ↓
[POST /api/public/n8n-callback] ← assinado HMAC-SHA256, atualiza documentos no app
       ↓
[Respond to Webhook]           ← devolve resultado ao Lovable
```

## O que vou fazer

### 1. n8n (projeto BPO)
- `search_projects` → resolver o ID do projeto **BPO**
- `list_credentials` → capturar IDs das credenciais **OpenAI** e **Supabase** já criadas
- `get_workflow_best_practices` (technique: `chatbot` e `data_extraction`) para consolidar padrões
- `get_node_types` para Webhook, Supabase, `@n8n/n8n-nodes-langchain.agent`, HTTP Request e Respond to Webhook
- `validate_workflow` + `create_workflow_from_code` para criar o workflow "BPO Agent" no projeto BPO
- Devolvo a URL do webhook para você configurar em `/app/automacoes`

### 2. Integração com o app Lovable (mudanças mínimas)
- **Nenhuma mudança de schema.** O `webhooks_empresa` da Fase 3 já cobre URL + secret + eventos.
- Confirmar que `/api/public/n8n-callback` aceita o payload que o agente retornar (já aceita: `status`, `valor`, `data_emissao`, `data_vencimento`, `emissor_documento`, `metadados`).
- Opcional: adicionar em `src/routes/_authenticated/app.automacoes.tsx` uma nota curta explicando o formato esperado do payload do agente (dica para o usuário final).

### 3. Segurança
- HMAC-SHA256 em ambos os sentidos (Lovable→n8n usa `dispatchWebhook`; n8n→Lovable usa `verifyHmac` já implementado).
- OpenAI API Key fica só em credencial do n8n — nunca sai para Lovable/Supabase.
- Supabase acessado pelo n8n com `service_role` (credencial do n8n), escopado por `empresa_id` no filtro de cada tool.
- RLS do Supabase permanece ativo para acesso via app; n8n opera server-side.

## Detalhes técnicos

**Tools do Agent (function calling nativo do gpt-4o):**
| Tool | Ação Supabase | Params |
|---|---|---|
| `search_documents` | `SELECT * FROM documentos WHERE empresa_id=$1 AND (titulo ILIKE $2 OR tipo=$3)` | empresa_id, query, tipo? |
| `update_document` | `UPDATE documentos SET status/valor/... WHERE id=$1 AND empresa_id=$2` | id, patch |
| `list_clientes` | `SELECT id,nome,documento FROM clientes WHERE empresa_id=$1` | empresa_id |

**Payload que o Lovable envia ao webhook n8n:**
```json
{ "evento": "documento.criado", "empresa_id": "...", "documento_id": "...", "input": "texto opcional" }
```

**Payload que o n8n devolve via callback:**
Estrutura já esperada por `n8n-callback.ts` — atualiza o documento e retorna `{ ok: true }`.

## Fora de escopo (não farei agora)
- Google Drive (você mencionou a credencial, mas não faz parte desta arquitetura RAG). Se quiser adicionar leitura de arquivos do Drive como fonte extra do RAG, me diga em uma próxima iteração.
- Publicação/ativação do workflow — deixo criado como **draft**; você revisa e ativa manualmente no n8n.
- Cadastro automático do URL do webhook em `webhooks_empresa` — você cola na tela `/app/automacoes` após eu devolver a URL.

Ao final, você recebe: (1) URL do webhook n8n, (2) instruções para colar em `/app/automacoes`, (3) resumo do que o agente sabe fazer.
