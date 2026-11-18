-- =====================================================================
-- Sistema inmobiliario · Migración 6: dirección en v_cita_detalle
-- El mensaje de confirmación por WhatsApp incluye la dirección de la
-- propiedad. CREATE OR REPLACE VIEW permite agregar columnas al final.
-- =====================================================================
create or replace view public.v_cita_detalle
with (security_invoker = true)
as
select
  c.cod_cita, c.fecha, c.hora, c.estado_cita, c.fecha_creacion,
  i.cod_interes, i.etapa,
  cl.cedula, cl.nombre, cl.apellido, cl.telefono,
  p.cod_propiedad, p.nombre_comercial,
  conf.estado_envio as estado_confirmacion,
  rec.estado_envio  as estado_recordatorio,
  p.direccion
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
