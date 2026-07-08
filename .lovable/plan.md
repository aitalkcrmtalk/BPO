## Situação atual

A base do Supabase usa nomes 100% em pt-BR e é bem diferente do schema que o Lovable estava assumindo. Todo o código de tipos, hooks, server functions, guards, telas admin e telas do app referencia tabelas/enums que **não existem** (`tenants`, `tenant_users`, `subscriptions`, `internal_approvals`, `audit_logs`, enums `tenant_status`, `plan_tier`, funções `has_role`, `is_tenant_member`, `tenant_role`).

### Schema real (resumo)

| Tabela | Papel na app |
|---|---|
| `empresas` | Tenant (id, nome, razao_social, cnpj, ativo) |
| `perfis` | Vínculo usuario↔empresa + papel (`usuario_id`, `empresa_id`, `nome`, `email`, `papel` text: `usuario`/`admin`/…) |
| `user_roles` | Papel global de plataforma (`role` text: `super_admin`) |
| `clientes` | Clientes da empresa (com `url_pasta_drive`) |
| `documentos` | Documentos (empresa_id, cliente_id, titulo, status text, metadados jsonb, url_arquivo) |
| `modulos` / `assinaturas` / `itens_assinatura` | Planos por módulo (chave, ativo, valor_base, status text) |
| `usuarios_clientes` | Restringe perfis a subconjunto de clientes |

**Sem enums.** Todos os status são `text`. **Sem trigger `handle_new_user`** — existe `criar_perfil_automatico` no Postgres.

**RLS:** só 2 políticas ativas hoje (`empresas` visível pelo próprio perfil; `user_roles` FOR ALL restrito a super_admin — essa **tem recursão infinita**, precisa virar `SECURITY DEFINER`). As demais tabelas têm RLS habilitado mas **sem policies** → hoje retornam vazio para tudo.

## Fase 1.5 — Alinhar Lovable ao schema real (obrigatório antes da Fase 2)

### 1. Reescrever `src/types/database.ts`
Substituir tudo pelas tabelas reais em pt-BR: `empresas`, `perfis`, `user_roles`, `clientes`, `documentos`, `modulos`, `assinaturas`, `itens_assinatura`, `usuarios_clientes`. Sem enums (union types TS onde fizer sentido).

### 2. Reescrever `src/types/index.ts` e `TenantContext`
Renomear conceito: `Tenant` → `Empresa`, `TenantUser` → `Perfil`. `TenantContext` passa a expor `empresa`, `perfil`, `papel`, `assinatura`, `modulosAtivos`, `isSuperAdmin`.

### 3. Reescrever `src/lib/tenant.functions.ts` (renomear para `empresa.functions.ts`)
- `getMyEmpresaContext`: lê `perfis` por `usuario_id = auth.uid()`, junta `empresas`, `assinaturas` + `itens_assinatura` + `modulos` ativos.
- Remover `completeOnboarding` (não existe `onboarded_at`/`segment`/`size`).
- Ajustar `useTenantContext` → `useEmpresaContext`.

### 4. Reescrever `src/lib/admin.functions.ts` e telas admin
Como não existe `tenants` nem `internal_approvals` nem `audit_logs`:
- `/admin/dashboard`: lista `empresas` (ativo/inativo), contagem de perfis e documentos.
- `/admin/tenants` → `/admin/empresas`: CRUD de `empresas` + toggle `ativo`.
- **Remover** rotas `/admin/aprovacoes` e `/admin/audit-logs` (sem tabela) e seus links no `AdminSidebar`.

### 5. Ajustar guards de super_admin
`user_roles.role` é `text`. Trocar checagem por `.eq('role','super_admin')` via **função SECURITY DEFINER** (ver item 8) — nunca ler a tabela direto no `beforeLoad` do admin (evita depender de RLS recursiva).

### 6. Ajustar telas do app
- `/app/dashboard`: contagens de `clientes`, `documentos` da `empresa` do usuário.
- `/app/clientes`: CRUD de `clientes` (nome, cnpj, url_pasta_drive).
- `/app/usuarios`: gestão de `perfis` da empresa + vínculo `usuarios_clientes`.
- `/app/documentos`: preparado para Fase 2 (upload/IA).
- `/app/assinatura`: mostra `assinaturas` + `modulos` ativos via `itens_assinatura`.
- **Remover** `/app/onboarding` (não há campos correspondentes) e `/app/automacoes` (ou deixar como placeholder Fase 2).

### 7. Ajustar cadastro público
`src/routes/api/public/register-tenant.ts` → cria `empresas` + `perfis` (papel `admin`) + convite via `supabaseAdmin.auth.admin.inviteUserByEmail`. Ajustar `cadastro.tsx` para os campos reais (nome empresa, cnpj, nome/email do responsável).

### 8. Migration SQL para o usuário aplicar no Supabase
Um único bloco com:
- Função `public.has_platform_role(_user_id uuid, _role text) RETURNS boolean SECURITY DEFINER` (quebra recursão de `user_roles`).
- Função `public.get_empresa_do_usuario(_user_id uuid) RETURNS uuid SECURITY DEFINER` (retorna `perfis.empresa_id`).
- Função `public.tem_papel_empresa(_user_id uuid, _empresa_id uuid, _papel text) RETURNS boolean SECURITY DEFINER`.
- **Recriar** política `user_roles_*` usando `has_platform_role` (sem recursão).
- Adicionar políticas RLS faltantes em: `perfis`, `clientes`, `documentos`, `assinaturas`, `itens_assinatura`, `modulos`, `usuarios_clientes` (SELECT/INSERT/UPDATE/DELETE escopados por `empresa_id = get_empresa_do_usuario(auth.uid())` OU `has_platform_role(auth.uid(),'super_admin')`).
- `GRANT` nas tabelas para `authenticated` e `service_role`.
- Inserir super_admin `aitalk@crmtalk.com.br`.

## Fase 2 (depois da 1.5)

Upload + Storage + IA (OpenAI via Lovable AI Gateway) + n8n + UI documentos.

## Detalhes técnicos

- Cliente Supabase continua igual (`CLIENT_SUPABASE_*`).
- Todos os `.eq('user_id', ...)` viram `.eq('usuario_id', ...)` onde apropriado.
- Nome do storage key do auth mantém.
- Colunas `criado_em`/`atualizado_em` em vez de `created_at`/`updated_at` em quase tudo (exceto `user_roles` que usa `created_at`).
- `documentos.status` é text livre — vou padronizar em `'pendente' | 'processando' | 'processado' | 'erro'` no TS.

## O que peço para você

1. Confirmar se posso **remover** `/admin/aprovacoes`, `/admin/audit-logs` e `/app/onboarding` (não há tabela correspondente).
2. Confirmar se `perfis.papel` só tem `usuario` e `admin`, ou existem outros valores (`operador`, `visualizador`)?
3. A migration SQL da Fase 1.5 (item 8) você aplica manualmente no Supabase, certo?
