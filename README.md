# CRM Talk (Projeto-BPO) — SaaS AaaS Multi-Tenant

Plataforma multi-tenant de BPO com IA, n8n e Supabase. Stack: TanStack Start (React 19 + Vite 7) + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query + Supabase (BYO).

## Setup rápido

1. **Supabase próprio.** Configure em `.env`:

    VITE_SUPABASE_URL=https://xxxxx.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=...

2. **Aplique a migration** (SQL Editor ou `supabase db push`):

    supabase/migrations/0001_init.sql

3. **Secrets de servidor** (Lovable → Secrets):

    SUPABASE_URL=...
    SUPABASE_PUBLISHABLE_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...   # necessário para criar usuários no admin
    N8N_WEBHOOK_URL=https://n8n.cliente.com/webhook
    N8N_API_KEY=...                  # opcional

`SERVICE_ROLE_KEY` e `N8N_API_KEY` nunca são expostas ao bundle client.

4. **Crie seu usuário super_admin**:
   - Supabase Dashboard → Auth → Add user (email + senha).
   - No SQL Editor:

    insert into public.user_roles (user_id, role)
    values ('<SEU-UUID>', 'super_admin');

5. `bun dev` e acesse `/login`. Super admin vai para `/admin/dashboard`; tenants comuns para `/app/dashboard`.

## Fluxo Fase 1

- `/` landing pública, `/planos` comparativo, `/cadastro` wizard 3 passos.
- `POST /api/public/register-tenant` cria tenants pending + aprovação e dispara webhook n8n `tenant-registered`.
- Super admin aprova em `/admin/aprovacoes` → cria user Supabase com senha temporária, dispara `tenant-approved` (n8n envia email).
- Primeiro login exige troca de senha (`/primeiro-acesso`) e leva a `/app/onboarding` → `/app/dashboard`.

## Próximas fases

- **Fase 2**: Clientes (CRUD), Documentos (Storage + IA via n8n), Realtime.
- **Fase 3**: Automações CRUD, checkout real (Stripe via n8n), analytics.
