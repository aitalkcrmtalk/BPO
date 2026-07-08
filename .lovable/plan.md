## Fase 3 — Escopo aprovado

4 blocos: (A) Gestão de usuários/convites, (B) Automações n8n, (C) Relatórios financeiros, (D) Admin da plataforma.

### A. Gestão de usuários/convites da empresa

Rota `/app/usuarios` (hoje só lista) vira CRUD completo:
- **Convidar** — modal com email + papel (`admin`/`usuario`) + clientes permitidos (multi-select de `clientes` da empresa). Server fn `convidarUsuario` usa `supabaseAdmin.auth.admin.inviteUserByEmail` com `redirectTo` para `/auth/callback`, cria `perfis` (empresa_id + papel) e insere linhas em `usuarios_clientes` quando papel = `usuario`.
- **Editar papel** e **gerenciar clientes vinculados** (add/remove em `usuarios_clientes`).
- **Desativar** perfil (`perfis.ativo=false`) — sem deletar de `auth.users`.
- Guard: só `admin` da empresa (ou `super_admin`) enxerga a página.

### B. Automações n8n (webhook out + callback in)

Nova tabela `webhooks_empresa` (`empresa_id`, `url`, `secret`, `ativo`, `eventos text[]`).
- Rota `/app/automacoes` (reativada): CRUD do webhook + botão "testar" (dispara payload dummy).
- Server fn `dispararWebhookDocumento` chamada dentro de `upsertDocumento` quando webhook está ativo — POST com HMAC-SHA256 do body no header `x-signature`. Envio "fire-and-forget" (não bloqueia UI se n8n cair).
- Endpoint público `src/routes/api/public/n8n-callback.ts` (POST): valida HMAC com o secret da empresa (empresa_id vem no payload), aceita `{ documento_id, status, metadados, valor, data_emissao, data_vencimento, emissor_documento }` e faz UPDATE via `supabaseAdmin`. Idempotente.
- Segredo global `N8N_CALLBACK_SIGNING_KEY` gerado via `generate_secret` (usado como fallback caso a empresa não tenha secret próprio).

### C. Relatórios e dashboards financeiros

Nova rota `/app/relatorios`:
- KPIs do mês corrente: total a receber (soma `valor` onde `tipo=nota_fiscal`/`comprovante`), a pagar (`boleto`/`contrato`), atrasados (data_vencimento < hoje AND status ≠ `concluido`).
- Gráfico barras por mês (últimos 6) e por tipo — `recharts` (já instalado).
- Filtros: período (mês/trimestre/ano), cliente, tipo.
- Exportação CSV client-side (blob download).
- Server fn `getRelatorioFinanceiro` agrega no Postgres (SUM/GROUP BY) para não trafegar linhas.

### D. Admin da plataforma (super_admin)

Expandir `/admin/dashboard` + nova rota `/admin/planos`:
- Dashboard: total empresas ativas/inativas, total perfis, total documentos (últimos 30d), MRR estimado (SUM `itens_assinatura.valor_base` onde `assinaturas.status=ativa`).
- `/admin/planos`: CRUD de `modulos` (chave, nome, valor_base, ativo).
- Em `/admin/empresas`: botão "gerenciar assinatura" abre modal para ativar/suspender `assinaturas` e adicionar/remover `itens_assinatura` (módulos contratados).

### Migração SQL (você aplica manualmente)

Um único bloco idempotente `docs/migration_fase_3.sql`:
1. `webhooks_empresa` (tabela + índice + RLS escopado por empresa + GRANT authenticated/service_role).
2. Colunas: `perfis.ativo boolean default true`, `assinaturas.status` check (`ativa`/`suspensa`/`cancelada`).
3. Índices: `documentos(empresa_id, data_vencimento)` e `documentos(empresa_id, tipo, status)` para relatórios.
4. Função `public.agregar_financeiro(_empresa_id uuid, _inicio date, _fim date)` SECURITY DEFINER para o relatório.

### Ordem de implementação

1. Migração SQL (você aplica) → aviso "aplicado" antes de eu prosseguir com as partes que dependem dela (B e D principalmente).
2. Bloco A (não depende de nada novo além de `perfis.ativo`).
3. Bloco C (depende só de índices).
4. Bloco B (depende de `webhooks_empresa` + secret).
5. Bloco D (depende de checks em `assinaturas`).

### Detalhes técnicos

- **HMAC**: `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`, comparação com `timingSafeEqual`.
- **Convites**: `inviteUserByEmail` requer `supabaseAdmin`; feito dentro de handler autorizado (`requireSupabaseAuth` + check `admin` da empresa).
- **Callback público**: `/api/public/n8n-callback` bypassa auth do site publicado, então HMAC é obrigatório.
- **CSV**: gerado no cliente com `Blob` + `URL.createObjectURL` — sem dependência nova.
- **Nenhuma dependência npm nova** (já temos `recharts`, `zod`, `@supabase/supabase-js`).

Confirma que posso seguir nessa ordem?
