-- =====================================================================
-- Projeto-BPO — Migration Fase 1.5
-- Alinha o Supabase (schema pt-BR já existente) ao app Lovable.
-- Aplique este bloco INTEIRO no SQL Editor do seu Supabase.
-- Idempotente: pode rodar mais de uma vez.
-- =====================================================================

-- 1. Funções SECURITY DEFINER (quebram recursão de RLS)
create or replace function public.has_platform_role(_user_id uuid, _role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;
grant execute on function public.has_platform_role(uuid, text) to authenticated, anon;

create or replace function public.get_empresa_do_usuario(_user_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from public.perfis where usuario_id = _user_id limit 1;
$$;
grant execute on function public.get_empresa_do_usuario(uuid) to authenticated;

create or replace function public.tem_papel_empresa(_user_id uuid, _empresa_id uuid, _papel text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfis
    where usuario_id = _user_id and empresa_id = _empresa_id and papel = _papel
  );
$$;
grant execute on function public.tem_papel_empresa(uuid, uuid, text) to authenticated;

-- 2. Recria política de user_roles SEM recursão infinita
drop policy if exists "user_roles_super_admin_only" on public.user_roles;
create policy "user_roles_select_self_or_admin" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_platform_role(auth.uid(), 'super_admin'));
create policy "user_roles_write_admin" on public.user_roles
  for all to authenticated
  using (public.has_platform_role(auth.uid(), 'super_admin'))
  with check (public.has_platform_role(auth.uid(), 'super_admin'));

-- 3. GRANTs (Data API precisa disso além do RLS)
grant select, insert, update on public.empresas          to authenticated;
grant select, insert, update, delete on public.perfis    to authenticated;
grant select, insert, update, delete on public.clientes  to authenticated;
grant select, insert, update, delete on public.documentos to authenticated;
grant select on public.modulos                           to authenticated;
grant select on public.assinaturas                       to authenticated;
grant select on public.itens_assinatura                  to authenticated;
grant select, insert, delete on public.usuarios_clientes to authenticated;
grant all on
  public.empresas, public.perfis, public.user_roles, public.clientes,
  public.documentos, public.modulos, public.assinaturas,
  public.itens_assinatura, public.usuarios_clientes
  to service_role;

-- 4. Políticas RLS — todas as tabelas
drop policy if exists "Empresas: acesso apenas a própria" on public.empresas;
drop policy if exists "empresas_select" on public.empresas;
drop policy if exists "empresas_update" on public.empresas;
create policy "empresas_select" on public.empresas for select to authenticated
  using (id = public.get_empresa_do_usuario(auth.uid())
         or public.has_platform_role(auth.uid(), 'super_admin'));
create policy "empresas_update" on public.empresas for update to authenticated
  using (public.tem_papel_empresa(auth.uid(), id, 'admin')
         or public.has_platform_role(auth.uid(), 'super_admin'));

drop policy if exists "perfis_select" on public.perfis;
drop policy if exists "perfis_admin_write" on public.perfis;
create policy "perfis_select" on public.perfis for select to authenticated
  using (empresa_id = public.get_empresa_do_usuario(auth.uid())
         or public.has_platform_role(auth.uid(), 'super_admin'));
create policy "perfis_admin_write" on public.perfis for all to authenticated
  using (
    usuario_id = auth.uid()
    or public.tem_papel_empresa(auth.uid(), empresa_id, 'admin')
    or public.has_platform_role(auth.uid(), 'super_admin')
  )
  with check (
    usuario_id = auth.uid()
    or public.tem_papel_empresa(auth.uid(), empresa_id, 'admin')
    or public.has_platform_role(auth.uid(), 'super_admin')
  );

drop policy if exists "clientes_all" on public.clientes;
create policy "clientes_all" on public.clientes for all to authenticated
  using (empresa_id = public.get_empresa_do_usuario(auth.uid())
         or public.has_platform_role(auth.uid(), 'super_admin'))
  with check (empresa_id = public.get_empresa_do_usuario(auth.uid())
              or public.has_platform_role(auth.uid(), 'super_admin'));

drop policy if exists "documentos_all" on public.documentos;
create policy "documentos_all" on public.documentos for all to authenticated
  using (empresa_id = public.get_empresa_do_usuario(auth.uid())
         or public.has_platform_role(auth.uid(), 'super_admin'))
  with check (empresa_id = public.get_empresa_do_usuario(auth.uid())
              or public.has_platform_role(auth.uid(), 'super_admin'));

drop policy if exists "assinaturas_select" on public.assinaturas;
create policy "assinaturas_select" on public.assinaturas for select to authenticated
  using (empresa_id = public.get_empresa_do_usuario(auth.uid())
         or public.has_platform_role(auth.uid(), 'super_admin'));

drop policy if exists "itens_assinatura_select" on public.itens_assinatura;
create policy "itens_assinatura_select" on public.itens_assinatura for select to authenticated
  using (
    assinatura_id in (
      select id from public.assinaturas
      where empresa_id = public.get_empresa_do_usuario(auth.uid())
    )
    or public.has_platform_role(auth.uid(), 'super_admin')
  );

drop policy if exists "modulos_select" on public.modulos;
create policy "modulos_select" on public.modulos for select to authenticated using (true);

drop policy if exists "usuarios_clientes_all" on public.usuarios_clientes;
create policy "usuarios_clientes_all" on public.usuarios_clientes for all to authenticated
  using (
    perfil_id in (
      select id from public.perfis
      where empresa_id = public.get_empresa_do_usuario(auth.uid())
    )
    or public.has_platform_role(auth.uid(), 'super_admin')
  )
  with check (
    perfil_id in (
      select id from public.perfis
      where empresa_id = public.get_empresa_do_usuario(auth.uid())
    )
    or public.has_platform_role(auth.uid(), 'super_admin')
  );

-- 5. Confirma super_admin (idempotente)
insert into public.user_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'aitalk@crmtalk.com.br'
on conflict do nothing;
