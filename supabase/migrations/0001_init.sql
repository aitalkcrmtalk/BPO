-- Projeto-BPO — Schema inicial (Fase 1)
-- Aplique via Supabase SQL Editor ou `supabase db push` no seu projeto Supabase.

-- Enums
create type public.tenant_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.tenant_role as enum ('owner', 'admin', 'operator', 'viewer');
create type public.plan_tier as enum ('free', 'starter', 'pro', 'enterprise');
create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.app_role as enum ('super_admin');
create type public.document_status as enum ('pending', 'processing', 'processed', 'error');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role_title text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "user_roles_select_self" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  document text,
  segment text,
  size text,
  phone text,
  status public.tenant_status not null default 'pending',
  plan public.plan_tier not null default 'free',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null
);
grant select, insert, update on public.tenants to authenticated;
grant all on public.tenants to service_role;
alter table public.tenants enable row level security;

create table public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'operator',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
grant select, insert, update, delete on public.tenant_users to authenticated;
grant all on public.tenant_users to service_role;
alter table public.tenant_users enable row level security;
create index on public.tenant_users (user_id);
create index on public.tenant_users (tenant_id);

create or replace function public.is_tenant_member(_tenant_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tenant_users where tenant_id = _tenant_id and user_id = _user_id);
$$;
grant execute on function public.is_tenant_member(uuid, uuid) to authenticated;

create or replace function public.tenant_role(_tenant_id uuid, _user_id uuid)
returns public.tenant_role language sql stable security definer set search_path = public as $$
  select role from public.tenant_users where tenant_id = _tenant_id and user_id = _user_id limit 1;
$$;
grant execute on function public.tenant_role(uuid, uuid) to authenticated;

create policy "tenants_select_members_or_admin" on public.tenants for select to authenticated using (
  public.is_tenant_member(id, auth.uid()) or public.has_role(auth.uid(), 'super_admin')
);
create policy "tenants_update_owners_or_admin" on public.tenants for update to authenticated using (
  public.tenant_role(id, auth.uid()) in ('owner','admin') or public.has_role(auth.uid(), 'super_admin')
);

create policy "tenant_users_select_same_tenant" on public.tenant_users for select to authenticated using (
  public.is_tenant_member(tenant_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin')
);
create policy "tenant_users_manage_owner_admin" on public.tenant_users for all to authenticated
  using (public.tenant_role(tenant_id, auth.uid()) in ('owner','admin') or public.has_role(auth.uid(), 'super_admin'))
  with check (public.tenant_role(tenant_id, auth.uid()) in ('owner','admin') or public.has_role(auth.uid(), 'super_admin'));

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  plan public.plan_tier not null default 'free',
  status public.subscription_status not null default 'incomplete',
  current_period_end timestamptz,
  provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_tenant_or_admin" on public.subscriptions for select to authenticated using (
  public.is_tenant_member(tenant_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin')
);

create table public.internal_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  protocol text not null unique,
  requester_email text not null,
  requester_name text not null,
  requester_phone text,
  requester_role text,
  status public.approval_status not null default 'pending',
  notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.internal_approvals to authenticated;
grant all on public.internal_approvals to service_role;
alter table public.internal_approvals enable row level security;
create policy "internal_approvals_admin_only" on public.internal_approvals for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create index on public.audit_logs (tenant_id, created_at desc);
create policy "audit_logs_select_tenant_or_admin" on public.audit_logs for select to authenticated using (
  (tenant_id is not null and public.is_tenant_member(tenant_id, auth.uid())) or public.has_role(auth.uid(), 'super_admin')
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();