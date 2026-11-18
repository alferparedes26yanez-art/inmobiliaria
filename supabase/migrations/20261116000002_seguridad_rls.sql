-- =====================================================================
-- Sistema inmobiliario · Migración 2: seguridad (RLS, es_admin, Storage)
-- =====================================================================

-- es_admin(): true si el usuario autenticado tiene fila en usuario_admin.
-- SECURITY DEFINER para poder consultar usuario_admin sin depender de su RLS.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.usuario_admin u
    where u.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated, service_role;

-- Privilegios base -----------------------------------------------------
-- El filtro real lo hace RLS; aquí solo se define qué puede intentar cada rol.
grant usage on schema public to anon, authenticated, service_role;

revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.propiedad, public.foto, public.tipo_propiedad, public.sector,
  public.servicio_basico, public.propiedad_servicio, public.avaluo
to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- RLS activado en TODAS las tablas -------------------------------------
alter table public.tipo_propiedad        enable row level security;
alter table public.sector                enable row level security;
alter table public.propiedad             enable row level security;
alter table public.avaluo                enable row level security;
alter table public.servicio_basico       enable row level security;
alter table public.propiedad_servicio    enable row level security;
alter table public.foto                  enable row level security;
alter table public.cliente               enable row level security;
alter table public.interes               enable row level security;
alter table public.cita                  enable row level security;
alter table public.notificacion_whatsapp enable row level security;
alter table public.usuario_admin         enable row level security;
alter table public.seguimiento_cliente   enable row level security;

-- Lectura pública ------------------------------------------------------
-- Catálogos: cualquiera puede leerlos.
create policy tipo_propiedad_lectura_publica on public.tipo_propiedad
  for select to anon, authenticated using (true);

create policy sector_lectura_publica on public.sector
  for select to anon, authenticated using (true);

create policy servicio_basico_lectura_publica on public.servicio_basico
  for select to anon, authenticated using (true);

-- Propiedades: el público solo ve las disponibles.
create policy propiedad_lectura_publica on public.propiedad
  for select to anon, authenticated using (estado = 'disponible');

-- Datos dependientes: visibles solo si su propiedad es visible para quien consulta
-- (la subconsulta pasa por el RLS de propiedad).
create policy foto_lectura_publica on public.foto
  for select to anon, authenticated
  using (exists (select 1 from public.propiedad p where p.cod_propiedad = foto.cod_propiedad));

create policy propiedad_servicio_lectura_publica on public.propiedad_servicio
  for select to anon, authenticated
  using (exists (select 1 from public.propiedad p where p.cod_propiedad = propiedad_servicio.cod_propiedad));

create policy avaluo_lectura_publica on public.avaluo
  for select to anon, authenticated
  using (exists (select 1 from public.propiedad p where p.cod_propiedad = avaluo.cod_propiedad));

-- Administradores: acceso completo a todas las tablas -------------------
create policy tipo_propiedad_admin on public.tipo_propiedad
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy sector_admin on public.sector
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy propiedad_admin on public.propiedad
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy avaluo_admin on public.avaluo
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy servicio_basico_admin on public.servicio_basico
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy propiedad_servicio_admin on public.propiedad_servicio
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy foto_admin on public.foto
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Tablas privadas: sin política para anon => el público no lee ni escribe.
create policy cliente_admin on public.cliente
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy interes_admin on public.interes
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy cita_admin on public.cita
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy notificacion_whatsapp_admin on public.notificacion_whatsapp
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy usuario_admin_admin on public.usuario_admin
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy seguimiento_cliente_admin on public.seguimiento_cliente
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Storage: bucket de fotos ---------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos-propiedades', 'fotos-propiedades', true)
on conflict (id) do nothing;

create policy fotos_propiedades_lectura_publica on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'fotos-propiedades');

create policy fotos_propiedades_admin_subir on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-propiedades' and public.es_admin());

create policy fotos_propiedades_admin_actualizar on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos-propiedades' and public.es_admin())
  with check (bucket_id = 'fotos-propiedades' and public.es_admin());

create policy fotos_propiedades_admin_borrar on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-propiedades' and public.es_admin());

-- Realtime: las citas nuevas llegan al instante al panel admin ----------
alter publication supabase_realtime add table public.cita;
