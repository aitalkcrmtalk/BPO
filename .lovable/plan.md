
# Projeto-BPO — Plano de Entrega Faseado

Entrega em **3 fases**. Cada fase termina com app funcional e testável. Este plano detalha **Fase 1** (fundação + fluxo de acesso) e resume Fases 2 e 3.

## Decisões de stack (ajustes ao spec original)

O template Lovable usa **TanStack Start** (SSR, file-based routing, Supabase integrado). Adapto o spec assim:

| Spec original | Substituição | Motivo |
|---|---|---|
| React Router v6 | TanStack Router (`src/routes/`) | Nativo do template, type-safe, SSR |
| `src/pages/*` | `src/routes/*` com convenção dot-separated | Requisito TanStack Start |
| Zustand para auth | Router context + `supabase.auth` + `_authenticated/route.tsx` gerenciado | Padrão do template |
| React Hook Form + Zod | Mantido | Compatível |
| shadcn/ui, Tailwind, TanStack Query, lucide, recharts, sonner, next-themes | Mantido | Já no template |
| i18next (pt-BR default) | Mantido, mas todas as strings já em pt-BR | Adicionado no bootstrap |
| `VITE_SUPABASE_*` fornecidas | Configuradas no `.env` do cliente | Supabase próprio |
| `VITE_OPENAI_API_KEY` no front | **Removido** — chave OpenAI fica no n8n/MCP server-side | Segurança |
| `VITE_N8N_API_KEY` no front | **Removido** — chamadas privadas ao n8n vão por server function que injeta a key de `process.env` | Segurança |

**Supabase**: você usa seu próprio projeto. Preciso das migrations SQL rodando no seu Supabase antes do app funcionar de ponta a ponta — entrego os arquivos `.sql` prontos para você aplicar via Supabase CLI ou SQL Editor.

## Identidade visual

- Paleta: `--navy #0B2545`, `--petrol #13315C`, `--neutral #F5F7FA`, `--white #FFFFFF`, `--amber #F4A261` como accent. Tokens semânticos shadcn mapeados no `src/styles.css` (@theme inline), suporte a tema claro/escuro via `next-themes`.
- Tipografia: **Inter** via `@fontsource-variable/inter`.
- Layout app: sidebar escura fixa (navy) com ícones lucide, topbar clara com tenant switcher, breadcrumbs e busca.
- Cards `rounded-xl`, sombra suave, spacing 8/16/24. Badges semânticas.

## Fase 1 — Fundação + Fluxo de Acesso (esta entrega)

### Escopo

1. **Bootstrap & design system**
   - Instalar deps: `@fontsource-variable/inter`, `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `next-themes`, `recharts`, `i18next`, `react-i18next`.
   - Configurar tokens de cor da paleta em `src/styles.css` (@theme inline + `:root` / `.dark`).
   - Título/meta reais em `src/routes/__root.tsx` ("Projeto-BPO — BPO Financeiro Automatizado").
   - Provider de tema (`next-themes`) + i18n bootstrap (pt-BR).

2. **Migrations SQL** (arquivo `supabase/migrations/0001_init.sql` para o cliente aplicar)
   - Enums: `tenant_status`, `tenant_role`, `plan_tier`, `subscription_status`, `approval_status`, `document_status`.
   - Tabelas: `tenants`, `tenant_users`, `profiles`, `subscriptions`, `internal_approvals`, `audit_logs`, `app_roles` (super_admin), `user_roles`.
   - RLS habilitada em todas + GRANTs para `authenticated` e `service_role`.
   - Function `has_role(_user_id, _role)` SECURITY DEFINER.
   - Function `current_tenant_id()` lendo de JWT claim ou `tenant_users` do usuário.
   - Trigger `handle_new_user` para criar `profiles`.
   - Policies:
     - `tenants`: SELECT se user ∈ tenant_users ou super_admin; UPDATE só super_admin.
     - `tenant_users`, `profiles`, `subscriptions`, `audit_logs`: escopo por tenant.
     - `internal_approvals`: só super_admin.

3. **Tipos TypeScript**
   - `src/types/database.ts` gerado manualmente refletindo o schema (Database namespace estilo Supabase).
   - `src/types/index.ts` para tipos de domínio compartilhados.

4. **Auth & guards**
   - Cliente browser: usar `src/integrations/supabase/client.ts` gerado pelo template (chaves via `VITE_SUPABASE_*`).
   - `src/routes/_authenticated/route.tsx` gerenciado (redireciona para `/login` se sem sessão).
   - `src/routes/_admin/route.tsx` novo layout: verifica sessão + `has_role('super_admin')`, senão 403.
   - Server function `getMyTenantContext` (com `requireSupabaseAuth`) que retorna `{ tenant, role, subscription, approval_status }`.
   - Hook `useSubscriptionGuard` que consome `getMyTenantContext` via TanStack Query e decide banner/bloqueio.
   - Root `onAuthStateChange` → `router.invalidate()` + sign-out hygiene documentada.

5. **Rotas públicas**
   - `/` — Landing institucional (hero, como funciona, planos resumidos, FAQ, CTA cadastro). Head completo com OG.
   - `/login` — email/senha via `supabase.auth.signInWithPassword`. Detecta se é super_admin e redireciona para `/admin/dashboard`, senão para `/app/dashboard`. Se `must_change_password=true` no metadata → `/primeiro-acesso`.
   - `/cadastro` — wizard 3 steps (empresa → responsável → confirmação/termos) com React Hook Form + Zod. Submete via server route público `POST /api/public/register-tenant` que:
     - Valida payload + rate limit por IP simples.
     - `INSERT` em `tenants (status='pending')` e `internal_approvals (status='pending')` usando `supabaseAdmin`.
     - Dispara webhook n8n `POST {N8N_WEBHOOK_URL}/tenant-registered` (fire-and-forget) para notificar equipe interna.
     - Retorna `{ protocol }` para tela de aguardo.
   - `/cadastro/aguardando` — confirmação com protocolo.
   - `/primeiro-acesso` — form email + senha temporária + nova senha + confirmação. Faz login, chama server fn `completeFirstAccess` que `updateUser({ password, data: { must_change_password: false } })` e redireciona para `/app/onboarding`.
   - `/recuperar-senha` — `resetPasswordForEmail` com `redirectTo=/reset-password`.
   - `/reset-password` — form de nova senha (pública, sem middleware).
   - `/planos` — comparativo estático de planos (dados mockados nesta fase; CTA leva para `/cadastro`).

6. **Painel super-admin** (`/admin/*` sob `_admin` layout)
   - `/admin/dashboard` — cards com contagem de aprovações pendentes, tenants ativos, MRR simulado.
   - `/admin/aprovacoes` — DataTable de `internal_approvals` pendentes. Ações:
     - **Aprovar**: chama server fn `approveTenant(approval_id, { notes })` que:
       - Verifica `has_role('super_admin')`.
       - Gera senha temporária 12 chars (alfanumérica + símbolos leves).
       - `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { must_change_password: true, tenant_id } })`.
       - `INSERT` em `tenant_users (role='owner')`, `INSERT` em `subscriptions (plan='free', status='trialing', period_end=+14d)`.
       - `UPDATE tenants SET status='approved', approved_by, approved_at`.
       - `UPDATE internal_approvals SET status='approved', reviewed_by, reviewed_at, notes`.
       - `INSERT audit_logs`.
       - Dispara webhook n8n `POST {N8N_WEBHOOK_URL}/tenant-approved` com `{ email, temp_password, tenant_name }` para o n8n enviar o email (o n8n é quem tem as credenciais SMTP).
     - **Rejeitar**: server fn `rejectTenant(approval_id, { notes })` idem sem criar user, dispara webhook `tenant-rejected`.
   - `/admin/tenants` — lista todos os tenants com status, plano, criado em. Ações: suspender/reativar.
   - `/admin/audit-logs` — tabela paginada de logs.

7. **App do tenant — mínimo funcional nesta fase**
   - `/app/onboarding` — form: dados complementares do tenant (segmento, tamanho, logo opcional). Marca `tenants.onboarded_at`. Skip para dashboard se já onboarded.
   - `/app/dashboard` — placeholder com cards vazios + `<SubscriptionBanner />` funcional, `<TenantSwitcher />` (mostra tenants do usuário, seta cookie `active_tenant_id` lido pelas server fns).
   - `/app/assinatura` — mostra plano atual e comparativo (checkout stub nesta fase).
   - Rotas `/app/clientes`, `/app/documentos`, `/app/automacoes`, `/app/usuarios`, `/app/configuracoes` — stubs "Em breve — Fase 2/3" para não quebrar navegação da sidebar.

8. **Guards & UX transversais**
   - `SubscriptionBanner`: past_due (âmbar, avisa 7d), canceled (vermelho, read-only), incomplete (redireciona `/app/assinatura`).
   - `RequireRole` wrapper para ações restritas dentro de páginas.
   - Skeletons + empty states ilustrados nas listas.
   - Toasts sonner para todas as ações.
   - Páginas 404 e error boundary já cobertas pelo template — customizar copy pt-BR.

### Componentes/arquivos entregues na Fase 1

```
src/
├── styles.css                            # paleta Projeto-BPO
├── lib/i18n.ts                           # pt-BR
├── lib/utils.ts
├── lib/temp-password.ts                  # gerador (server-only)
├── types/database.ts
├── types/index.ts
├── integrations/supabase/                # já gerado pelo template
├── components/
│   ├── layout/AppSidebar.tsx
│   ├── layout/AppTopbar.tsx
│   ├── layout/AdminSidebar.tsx
│   ├── layout/PublicHeader.tsx
│   ├── SubscriptionBanner.tsx
│   ├── TenantSwitcher.tsx
│   ├── StatusBadge.tsx
│   ├── PlanCard.tsx
│   ├── DataTable.tsx
│   ├── ThemeToggle.tsx
│   └── ui/*                              # shadcn existente
├── hooks/
│   ├── useTenantContext.ts
│   └── useSubscriptionGuard.ts
├── server/
│   ├── tenant.functions.ts               # getMyTenantContext, completeFirstAccess, listMyTenants
│   ├── admin.functions.ts                # approveTenant, rejectTenant, listPendingApprovals, listTenants, listAuditLogs (todas com has_role check)
│   └── n8n.server.ts                     # helper para chamar webhooks n8n com VITE_N8N_WEBHOOK_URL + N8N_API_KEY (server env)
├── routes/
│   ├── __root.tsx                        # meta pt-BR, ThemeProvider, i18n, Toaster
│   ├── index.tsx                         # landing
│   ├── login.tsx
│   ├── cadastro.tsx
│   ├── cadastro.aguardando.tsx
│   ├── primeiro-acesso.tsx
│   ├── recuperar-senha.tsx
│   ├── reset-password.tsx
│   ├── planos.tsx
│   ├── api/public/register-tenant.ts     # server route público
│   ├── _authenticated/
│   │   ├── route.tsx                     # gerenciado — não edito
│   │   └── app/
│   │       ├── route.tsx                 # AppLayout (sidebar + topbar + banner + Outlet)
│   │       ├── dashboard.tsx
│   │       ├── onboarding.tsx
│   │       ├── assinatura.tsx
│   │       ├── clientes.tsx              # stub
│   │       ├── documentos.tsx            # stub
│   │       ├── automacoes.tsx            # stub
│   │       ├── usuarios.tsx              # stub
│   │       └── configuracoes.tsx         # stub
│   └── _authenticated/admin/
│       ├── route.tsx                     # AdminLayout + has_role('super_admin') gate
│       ├── dashboard.tsx
│       ├── aprovacoes.tsx
│       ├── tenants.tsx
│       └── audit-logs.tsx
├── supabase/migrations/0001_init.sql     # para você aplicar no seu Supabase
└── README.md                             # setup, env, como aplicar migrations, como promover super_admin
```

### Variáveis de ambiente (Fase 1)

Frontend (`.env`):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Server (secrets Lovable):
```
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...           # necessário para approveTenant criar usuários
N8N_WEBHOOK_URL=https://n8n.cliente.com/webhook
N8N_API_KEY=...                          # opcional, para chamadas API n8n
```

Nunca coloco `SERVICE_ROLE_KEY` nem `OPENAI_KEY` no bundle client.

### Como o super_admin inicial é criado

Após aplicar as migrations e criar sua conta pelo `/login` (via Supabase Dashboard → Auth → Add user), você roda no SQL Editor:
```sql
INSERT INTO public.user_roles (user_id, role) VALUES ('<seu-uuid>', 'super_admin');
```
Documentado no README.

### Fora do escopo da Fase 1

- Upload de documentos, MCP, OpenAI, Realtime → Fase 2.
- Autocadastro de clientes, CRUD completo → Fase 2.
- Configuração de automações, checkout real de assinatura, gateway → Fase 3.

## Fase 2 — Operacional (após aprovar Fase 1)

Clientes (CRUD com RLS + roles), Documentos (upload Storage bucket privado por tenant, webhook n8n `process-document`, Realtime subscription para status, JsonViewer, reprocessamento, exportação JSON/CSV), enforcement de limite de plano.

## Fase 3 — Automação & Billing

Automations CRUD + trigger manual + histórico, checkout real (Stripe via webhook n8n), MRR/analytics no admin, audit logs completos, i18n en-US adicional.

## Critérios de aceite da Fase 1

- ✅ Landing acessível em `/` com paleta e tipografia corretas.
- ✅ Cadastro público cria `tenants` pending e mostra tela de aguardo.
- ✅ Super admin vê aprovação em `/admin/aprovacoes` e aprova/rejeita.
- ✅ Aprovação gera user Supabase + senha temporária + dispara webhook n8n.
- ✅ Primeiro acesso força troca de senha e redireciona para onboarding.
- ✅ Onboarding conclui e leva ao dashboard com banner de assinatura trialing.
- ✅ Tenant switcher funcional para user com múltiplos tenants.
- ✅ Guards: rota admin bloqueada para não-admins; rotas app bloqueadas sem sessão; tenants sem aprovação não passam do onboarding.
- ✅ RLS ativa: usuário só vê dados do próprio tenant.
- ✅ Responsivo, tema claro/escuro, pt-BR, sem `any`.
- ✅ README com passos de setup + SQL para promover super_admin.
