-- =====================================================================
-- Sistema inmobiliario · Migración 5: recordatorios de WhatsApp
-- pg_cron ejecuta cada 15 minutos programar_recordatorios(), que:
--   1. Busca las citas "agendada" que empiezan en las próximas 24 horas
--      y aún no tienen recordatorio.
--   2. Inserta su notificación (el mensaje empieza con "Recordatorio").
--   3. Llama a la Edge Function enviar-whatsapp con pg_net.
-- También reintenta las notificaciones que quedaron pendientes.
--
-- La URL de la Edge Function se guarda en Supabase Vault con el nombre
-- 'url_enviar_whatsapp' (ver README). Sin ese secreto las notificaciones
-- se crean igual y quedan en "pendiente".
-- =====================================================================
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.programar_recordatorios()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ahora   timestamp := now() at time zone 'America/Guayaquil';
  v_url     text;
  v_total   integer := 0;
  r         record;
begin
  -- 1 y 2. Crear los recordatorios que faltan.
  insert into public.notificacion_whatsapp (cod_cita, mensaje, estado_envio)
  select
    c.cod_cita,
    format(
      'Recordatorio: %s, tienes una visita a "%s" el %s a las %s. Dirección: %s. ¡Te esperamos!',
      cl.nombre, p.nombre_comercial, to_char(c.fecha, 'DD/MM/YYYY'), to_char(c.hora, 'HH24:MI'), p.direccion
    ),
    'pendiente'
  from public.cita c
  join public.interes i   on i.cod_interes = c.cod_interes
  join public.cliente cl  on cl.cedula = i.cedula
  join public.propiedad p on p.cod_propiedad = i.cod_propiedad
  where c.estado_cita = 'agendada'
    and (c.fecha + c.hora) >  v_ahora
    and (c.fecha + c.hora) <= v_ahora + interval '24 hours'
    and not exists (
      select 1 from public.notificacion_whatsapp n
      where n.cod_cita = c.cod_cita and n.mensaje like 'Recordatorio%'
    );

  -- 3. Enviar todo lo pendiente de citas vigentes mediante la Edge Function.
  select ds.decrypted_secret into v_url
  from vault.decrypted_secrets ds
  where ds.name = 'url_enviar_whatsapp'
  limit 1;

  if v_url is null then
    raise notice 'Falta el secreto url_enviar_whatsapp en Vault: las notificaciones quedan pendientes.';
    return 0;
  end if;

  for r in
    select n.cod_notificacion
    from public.notificacion_whatsapp n
    join public.cita c on c.cod_cita = n.cod_cita
    where n.estado_envio = 'pendiente'
      and c.estado_cita = 'agendada'
      and (c.fecha + c.hora) > v_ahora
    order by n.cod_notificacion
  loop
    perform net.http_post(
      url     := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object('cod_notificacion', r.cod_notificacion)
    );
    v_total := v_total + 1;
  end loop;

  return v_total;
end;
$$;

revoke all on function public.programar_recordatorios() from public, anon, authenticated;
grant execute on function public.programar_recordatorios() to service_role;

-- Job cada 15 minutos (se reemplaza si ya existía).
select cron.unschedule(jobid) from cron.job where jobname = 'recordatorios-whatsapp';
select cron.schedule('recordatorios-whatsapp', '*/15 * * * *', $$select public.programar_recordatorios()$$);
