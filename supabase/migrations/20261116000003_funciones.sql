-- =====================================================================
-- Sistema inmobiliario · Migración 3: triggers, RPC y vistas del dashboard
-- Zona horaria de negocio: America/Guayaquil
-- =====================================================================

-- ---------------------------------------------------------------------
-- Triggers sobre interes
-- ---------------------------------------------------------------------

-- Mantiene fecha_actualizacion al día cuando cambia la etapa o el anticipo.
create or replace function public.tg_interes_fecha_actualizacion()
returns trigger
language plpgsql
as $$
begin
  if new.etapa is distinct from old.etapa
     or new.monto_anticipo_usd is distinct from old.monto_anticipo_usd then
    new.fecha_actualizacion := now();
  end if;
  return new;
end;
$$;

create trigger interes_fecha_actualizacion
  before update on public.interes
  for each row execute function public.tg_interes_fecha_actualizacion();

-- Sincroniza el estado de la propiedad con el embudo:
--   anticipo -> reservada, vendido -> vendida,
--   y si el interés sale de anticipo/vendido y nadie más la tiene tomada -> disponible.
create or replace function public.tg_interes_sincronizar_propiedad()
returns trigger
language plpgsql
as $$
begin
  if new.etapa = 'vendido' then
    update public.propiedad set estado = 'vendida'
    where cod_propiedad = new.cod_propiedad and estado <> 'vendida';
  elsif new.etapa = 'anticipo' then
    update public.propiedad set estado = 'reservada'
    where cod_propiedad = new.cod_propiedad and estado = 'disponible';
  elsif tg_op = 'UPDATE' and old.etapa in ('anticipo', 'vendido') then
    update public.propiedad p set estado = 'disponible'
    where p.cod_propiedad = new.cod_propiedad
      and p.estado in ('reservada', 'vendida')
      and not exists (
        select 1 from public.interes i
        where i.cod_propiedad = new.cod_propiedad
          and i.cod_interes <> new.cod_interes
          and i.etapa in ('anticipo', 'vendido')
      );
  end if;
  return new;
end;
$$;

create trigger interes_sincronizar_propiedad
  after insert or update of etapa on public.interes
  for each row execute function public.tg_interes_sincronizar_propiedad();

-- ---------------------------------------------------------------------
-- RPC pública: horarios ya ocupados de una propiedad en una fecha
-- (el público no puede leer la tabla cita; solo recibe las horas tomadas)
-- ---------------------------------------------------------------------
create or replace function public.horarios_ocupados(p_cod_propiedad integer, p_fecha date)
returns setof time
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.hora
  from public.cita c
  join public.interes i on i.cod_interes = c.cod_interes
  where i.cod_propiedad = p_cod_propiedad
    and c.fecha = p_fecha
    and c.estado_cita = 'agendada'
  order by c.hora;
$$;

-- ---------------------------------------------------------------------
-- RPC pública: agendar_visita
-- Una sola transacción: valida, registra cliente, interés, cita y notificación.
-- Horarios: bloques de una hora, de 09:00 a 17:00 (la última visita termina a las 18:00).
-- ---------------------------------------------------------------------
create or replace function public.agendar_visita(
  p_cedula         text,
  p_nombre         text,
  p_apellido       text,
  p_telefono       text,
  p_correo         text,
  p_cod_propiedad  integer,
  p_fecha          date,
  p_hora           time
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ahora      timestamp := now() at time zone 'America/Guayaquil';
  v_cedula     text := btrim(coalesce(p_cedula, ''));
  v_nombre     text := btrim(coalesce(p_nombre, ''));
  v_apellido   text := btrim(coalesce(p_apellido, ''));
  v_telefono   text := btrim(coalesce(p_telefono, ''));
  v_correo     text := lower(btrim(coalesce(p_correo, '')));
  v_propiedad  text;
  v_interes    integer;
  v_cita       integer;
begin
  -- 1. Validaciones ----------------------------------------------------
  if v_cedula !~ '^[0-9]{10}$' then
    raise exception 'La cédula debe tener exactamente 10 dígitos.';
  end if;
  if char_length(v_nombre) < 2 or char_length(v_nombre) > 60 then
    raise exception 'El nombre debe tener entre 2 y 60 caracteres.';
  end if;
  if char_length(v_apellido) < 2 or char_length(v_apellido) > 60 then
    raise exception 'El apellido debe tener entre 2 y 60 caracteres.';
  end if;
  if v_telefono !~ '^09[0-9]{8}$' then
    raise exception 'El teléfono debe tener 10 dígitos y empezar con 09.';
  end if;
  if v_correo !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_correo) > 120 then
    raise exception 'El correo electrónico no es válido.';
  end if;
  if p_cod_propiedad is null or p_fecha is null or p_hora is null then
    raise exception 'Debes indicar la propiedad, la fecha y la hora de la visita.';
  end if;

  select p.nombre_comercial into v_propiedad
  from public.propiedad p
  where p.cod_propiedad = p_cod_propiedad and p.estado = 'disponible';
  if not found then
    raise exception 'La propiedad no existe o ya no está disponible.';
  end if;

  if (p_fecha + p_hora) <= v_ahora then
    raise exception 'La fecha y la hora de la visita deben ser futuras.';
  end if;
  if p_hora < time '09:00' or p_hora > time '17:00'
     or extract(minute from p_hora) <> 0 or extract(second from p_hora) <> 0 then
    raise exception 'El horario de visitas es de 09:00 a 18:00, en bloques de una hora.';
  end if;

  -- Evita que dos personas tomen el mismo horario al mismo tiempo.
  perform pg_advisory_xact_lock(
    p_cod_propiedad,
    (p_fecha - date '2000-01-01') * 24 + extract(hour from p_hora)::integer
  );

  if exists (
    select 1
    from public.cita c
    join public.interes i on i.cod_interes = c.cod_interes
    where i.cod_propiedad = p_cod_propiedad
      and c.fecha = p_fecha
      and c.hora = p_hora
      and c.estado_cita = 'agendada'
  ) then
    raise exception 'Ese horario ya está reservado para esta propiedad. Elige otro.';
  end if;

  if exists (select 1 from public.cliente c where c.correo = v_correo and c.cedula <> v_cedula) then
    raise exception 'Ese correo ya está registrado con otra cédula.';
  end if;

  -- 2. Cliente (insertar o actualizar por cédula) ------------------------
  insert into public.cliente (cedula, nombre, apellido, telefono, correo)
  values (v_cedula, v_nombre, v_apellido, v_telefono, v_correo)
  on conflict (cedula) do update
    set nombre   = excluded.nombre,
        apellido = excluded.apellido,
        telefono = excluded.telefono,
        correo   = excluded.correo;

  -- 3. Interés (no retrocede a quien ya dio anticipo o compró) -----------
  insert into public.interes (cedula, cod_propiedad, etapa)
  values (v_cedula, p_cod_propiedad, 'cita_agendada')
  on conflict (cedula, cod_propiedad) do update
    set etapa = case
                  when interes.etapa in ('anticipo', 'vendido') then interes.etapa
                  else 'cita_agendada'
                end,
        fecha_actualizacion = now()
  returning cod_interes into v_interes;

  -- 4. Cita ---------------------------------------------------------------
  insert into public.cita (cod_interes, fecha, hora, estado_cita)
  values (v_interes, p_fecha, p_hora, 'agendada')
  returning cod_cita into v_cita;

  -- 5. Notificación de confirmación (pendiente de envío) -------------------
  insert into public.notificacion_whatsapp (cod_cita, mensaje, estado_envio)
  values (
    v_cita,
    format(
      'Hola %s, tu visita a "%s" quedó agendada para el %s a las %s. ¡Te esperamos!',
      v_nombre, v_propiedad, to_char(p_fecha, 'DD/MM/YYYY'), to_char(p_hora, 'HH24:MI')
    ),
    'pendiente'
  );

  -- 6. Código de la cita ---------------------------------------------------
  return v_cita;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC admin: marcar una foto como principal (desmarca las demás)
-- SECURITY INVOKER: el RLS de foto exige es_admin().
-- ---------------------------------------------------------------------
create or replace function public.marcar_foto_principal(p_cod_foto integer)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_propiedad integer;
begin
  select f.cod_propiedad into v_propiedad from public.foto f where f.cod_foto = p_cod_foto;
  if not found then
    raise exception 'La foto no existe.';
  end if;
  update public.foto set es_principal = false
  where cod_propiedad = v_propiedad and es_principal and cod_foto <> p_cod_foto;
  update public.foto set es_principal = true where cod_foto = p_cod_foto;
end;
$$;

-- ---------------------------------------------------------------------
-- Dashboard (SECURITY INVOKER: solo devuelven datos a quien pasa el RLS)
-- ---------------------------------------------------------------------

-- KPIs con su valor del periodo anterior y la variación porcentual.
create or replace function public.dashboard_kpis()
returns table (indicador text, valor numeric, valor_anterior numeric, variacion_pct numeric)
language sql
stable
set search_path = public, pg_temp
as $$
  with p as (
    select
      date_trunc('month', h.hoy)::date                        as mes_ini,
      (date_trunc('month', h.hoy) - interval '1 month')::date as mes_ant_ini,
      date_trunc('week', h.hoy)::date                         as sem_ini,
      (date_trunc('week', h.hoy) - interval '7 days')::date   as sem_ant_ini
    from (select (now() at time zone 'America/Guayaquil')::date::timestamp as hoy) h
  ),
  k as (
    select 1 as orden, 'propiedades_disponibles' as indicador,
      (select count(*) from public.propiedad where estado = 'disponible')::numeric as valor,
      (select count(*) from public.propiedad pr, p
        where pr.estado = 'disponible'
          and (pr.fecha_registro at time zone 'America/Guayaquil')::date < p.mes_ini)::numeric as valor_anterior
    union all
    select 2, 'citas_semana',
      (select count(*) from public.cita c, p
        where c.estado_cita <> 'cancelada' and c.fecha >= p.sem_ini and c.fecha < p.sem_ini + 7)::numeric,
      (select count(*) from public.cita c, p
        where c.estado_cita <> 'cancelada' and c.fecha >= p.sem_ant_ini and c.fecha < p.sem_ini)::numeric
    union all
    select 3, 'clientes_nuevos_mes',
      (select count(*) from public.cliente c, p
        where (c.fecha_registro at time zone 'America/Guayaquil')::date >= p.mes_ini)::numeric,
      (select count(*) from public.cliente c, p
        where (c.fecha_registro at time zone 'America/Guayaquil')::date >= p.mes_ant_ini
          and (c.fecha_registro at time zone 'America/Guayaquil')::date < p.mes_ini)::numeric
    union all
    select 4, 'anticipos_mes_usd',
      (select coalesce(sum(i.monto_anticipo_usd), 0) from public.interes i, p
        where i.etapa in ('anticipo', 'vendido')
          and (i.fecha_actualizacion at time zone 'America/Guayaquil')::date >= p.mes_ini)::numeric,
      (select coalesce(sum(i.monto_anticipo_usd), 0) from public.interes i, p
        where i.etapa in ('anticipo', 'vendido')
          and (i.fecha_actualizacion at time zone 'America/Guayaquil')::date >= p.mes_ant_ini
          and (i.fecha_actualizacion at time zone 'America/Guayaquil')::date < p.mes_ini)::numeric
  )
  select k.indicador, k.valor, k.valor_anterior,
    case when k.valor_anterior = 0 then null
         else round((k.valor - k.valor_anterior) / k.valor_anterior * 100, 1)
    end
  from k
  order by k.orden;
$$;

-- Clientes registrados: por día si p_meses <= 1 (últimos 30 días), por mes en otro caso.
create or replace function public.dashboard_clientes_registrados(p_meses integer default 12)
returns table (periodo date, total bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  with cfg as (
    select
      h.hoy,
      (coalesce(p_meses, 12) <= 1) as diario,
      case when coalesce(p_meses, 12) <= 1 then interval '1 day' else interval '1 month' end as paso
    from (select (now() at time zone 'America/Guayaquil')::date::timestamp as hoy) h
  ),
  serie as (
    select g as desde, g + cfg.paso as hasta
    from cfg,
      generate_series(
        case when cfg.diario then cfg.hoy - interval '29 days'
             else date_trunc('month', cfg.hoy) - make_interval(months => least(coalesce(p_meses, 12), 60) - 1)
        end,
        case when cfg.diario then cfg.hoy else date_trunc('month', cfg.hoy) end,
        cfg.paso
      ) g
  )
  select s.desde::date, count(c.cedula)
  from serie s
  left join public.cliente c
    on (c.fecha_registro at time zone 'America/Guayaquil') >= s.desde
   and (c.fecha_registro at time zone 'America/Guayaquil') <  s.hasta
  group by s.desde
  order by s.desde;
$$;

-- Propiedades vendidas por mes (según la fecha en que el interés pasó a "vendido").
create or replace function public.dashboard_ventas_por_mes(p_meses integer default 8)
returns table (mes date, total bigint, monto_usd numeric)
language sql
stable
set search_path = public, pg_temp
as $$
  with serie as (
    select g as desde, g + interval '1 month' as hasta
    from (select date_trunc('month', (now() at time zone 'America/Guayaquil')::date::timestamp) as mes_actual) h,
      generate_series(
        h.mes_actual - make_interval(months => least(greatest(coalesce(p_meses, 8), 1), 60) - 1),
        h.mes_actual,
        interval '1 month'
      ) g
  )
  select s.desde::date, count(i.cod_interes), coalesce(sum(pr.precio_usd), 0)
  from serie s
  left join public.interes i
    on i.etapa = 'vendido'
   and (i.fecha_actualizacion at time zone 'America/Guayaquil') >= s.desde
   and (i.fecha_actualizacion at time zone 'America/Guayaquil') <  s.hasta
  left join public.propiedad pr on pr.cod_propiedad = i.cod_propiedad
  group by s.desde
  order by s.desde;
$$;

-- Embudo: conteo de intereses por etapa (incluye etapas en cero).
create or replace function public.dashboard_embudo()
returns table (etapa text, orden integer, total bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select e.etapa, e.orden, count(i.cod_interes)
  from (values
    ('interesado', 1), ('cita_agendada', 2), ('visitó', 3),
    ('anticipo', 4), ('vendido', 5), ('descartado', 6)
  ) as e(etapa, orden)
  left join public.interes i on i.etapa = e.etapa
  group by e.etapa, e.orden
  order by e.orden;
$$;

-- Heatmap: citas por día de la semana (1 = lunes … 7 = domingo) y hora (9 … 17).
create or replace function public.dashboard_heatmap_citas()
returns table (dia_semana integer, hora integer, total bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select d.dia, h.hora, count(c.cod_cita)
  from generate_series(1, 7) as d(dia)
  cross join generate_series(9, 17) as h(hora)
  left join public.cita c
    on extract(isodow from c.fecha)::integer = d.dia
   and extract(hour from c.hora)::integer = h.hora
   and c.estado_cita <> 'cancelada'
  group by d.dia, h.hora
  order by d.dia, h.hora;
$$;

-- ---------------------------------------------------------------------
-- Vistas (security_invoker: respetan el RLS de quien consulta)
-- ---------------------------------------------------------------------

-- Cita con su cliente, propiedad y estado de las notificaciones de WhatsApp.
create view public.v_cita_detalle
with (security_invoker = true)
as
select
  c.cod_cita, c.fecha, c.hora, c.estado_cita, c.fecha_creacion,
  i.cod_interes, i.etapa,
  cl.cedula, cl.nombre, cl.apellido, cl.telefono,
  p.cod_propiedad, p.nombre_comercial,
  conf.estado_envio as estado_confirmacion,
  rec.estado_envio  as estado_recordatorio
from public.cita c
join public.interes i   on i.cod_interes = c.cod_interes
join public.cliente cl  on cl.cedula = i.cedula
join public.propiedad p on p.cod_propiedad = i.cod_propiedad
left join lateral (
  select n.estado_envio from public.notificacion_whatsapp n
  where n.cod_cita = c.cod_cita and n.mensaje not like 'Recordatorio%'
  order by n.cod_notificacion desc limit 1
) conf on true
left join lateral (
  select n.estado_envio from public.notificacion_whatsapp n
  where n.cod_cita = c.cod_cita and n.mensaje like 'Recordatorio%'
  order by n.cod_notificacion desc limit 1
) rec on true;

-- Cartera: cada cliente con su etapa más reciente y su último contacto.
create view public.v_cliente_cartera
with (security_invoker = true)
as
select
  cl.cedula, cl.nombre, cl.apellido, cl.telefono, cl.correo, cl.fecha_registro,
  ult.etapa            as etapa_actual,
  ult.cod_propiedad    as cod_propiedad_actual,
  ult.nombre_comercial as propiedad_actual,
  (select count(*) from public.interes i where i.cedula = cl.cedula) as total_intereses,
  seg.ultimo_contacto,
  (
    coalesce(ult.etapa, '') = 'descartado'
    or coalesce(seg.ultimo_contacto, cl.fecha_registro) < now() - interval '30 days'
  ) as para_recuperar
from public.cliente cl
left join lateral (
  select i.etapa, i.cod_propiedad, p.nombre_comercial
  from public.interes i
  join public.propiedad p on p.cod_propiedad = i.cod_propiedad
  where i.cedula = cl.cedula
  order by i.fecha_actualizacion desc, i.cod_interes desc
  limit 1
) ult on true
left join lateral (
  select max(s.fecha) as ultimo_contacto
  from public.seguimiento_cliente s
  where s.cedula = cl.cedula
) seg on true;

-- ---------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------
revoke all on function public.horarios_ocupados(integer, date) from public;
revoke all on function public.agendar_visita(text, text, text, text, text, integer, date, time) from public;
revoke all on function public.marcar_foto_principal(integer) from public, anon;
revoke all on function public.dashboard_kpis() from public, anon;
revoke all on function public.dashboard_clientes_registrados(integer) from public, anon;
revoke all on function public.dashboard_ventas_por_mes(integer) from public, anon;
revoke all on function public.dashboard_embudo() from public, anon;
revoke all on function public.dashboard_heatmap_citas() from public, anon;

grant execute on function public.horarios_ocupados(integer, date) to anon, authenticated, service_role;
grant execute on function public.agendar_visita(text, text, text, text, text, integer, date, time)
  to anon, authenticated, service_role;
grant execute on function public.marcar_foto_principal(integer) to authenticated, service_role;
grant execute on function public.dashboard_kpis() to authenticated, service_role;
grant execute on function public.dashboard_clientes_registrados(integer) to authenticated, service_role;
grant execute on function public.dashboard_ventas_por_mes(integer) to authenticated, service_role;
grant execute on function public.dashboard_embudo() to authenticated, service_role;
grant execute on function public.dashboard_heatmap_citas() to authenticated, service_role;

revoke all on public.v_cita_detalle, public.v_cliente_cartera from anon;
grant select on public.v_cita_detalle, public.v_cliente_cartera to authenticated, service_role;
