-- =====================================================================
-- Sistema inmobiliario · Migración 4: RPC guardar_propiedad
-- Crea o actualiza una propiedad junto con sus servicios básicos y,
-- opcionalmente, un nuevo avalúo. Todo en una sola transacción.
-- =====================================================================
create or replace function public.guardar_propiedad(
  p_cod_propiedad  integer,                 -- NULL = crear
  p_datos          jsonb,                   -- columnas de propiedad
  p_servicios      jsonb default '[]',      -- [{cod_servicio, estado_servicio}]
  p_avaluo         jsonb default null       -- {fecha_avaluo, valor_avaluo_usd, nivel_acabados} o NULL
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cod integer;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede guardar propiedades.' using errcode = '42501';
  end if;

  if p_cod_propiedad is null then
    insert into public.propiedad (
      nombre_comercial, cod_tipo, cod_sector, direccion, latitud, longitud,
      area_terreno_m2, area_construccion_m2, precio_usd, descripcion, estado
    ) values (
      btrim(p_datos->>'nombre_comercial'),
      (p_datos->>'cod_tipo')::smallint,
      (p_datos->>'cod_sector')::integer,
      btrim(p_datos->>'direccion'),
      (p_datos->>'latitud')::decimal(9,6),
      (p_datos->>'longitud')::decimal(9,6),
      nullif(p_datos->>'area_terreno_m2', '')::decimal(10,2),
      nullif(p_datos->>'area_construccion_m2', '')::decimal(10,2),
      (p_datos->>'precio_usd')::decimal(12,2),
      nullif(btrim(coalesce(p_datos->>'descripcion', '')), ''),
      coalesce(nullif(p_datos->>'estado', ''), 'disponible')
    )
    returning cod_propiedad into v_cod;
  else
    update public.propiedad set
      nombre_comercial     = btrim(p_datos->>'nombre_comercial'),
      cod_tipo             = (p_datos->>'cod_tipo')::smallint,
      cod_sector           = (p_datos->>'cod_sector')::integer,
      direccion            = btrim(p_datos->>'direccion'),
      latitud              = (p_datos->>'latitud')::decimal(9,6),
      longitud             = (p_datos->>'longitud')::decimal(9,6),
      area_terreno_m2      = nullif(p_datos->>'area_terreno_m2', '')::decimal(10,2),
      area_construccion_m2 = nullif(p_datos->>'area_construccion_m2', '')::decimal(10,2),
      precio_usd           = (p_datos->>'precio_usd')::decimal(12,2),
      descripcion          = nullif(btrim(coalesce(p_datos->>'descripcion', '')), ''),
      estado               = coalesce(nullif(p_datos->>'estado', ''), estado)
    where cod_propiedad = p_cod_propiedad
    returning cod_propiedad into v_cod;

    if v_cod is null then
      raise exception 'La propiedad no existe.';
    end if;
  end if;

  insert into public.propiedad_servicio (cod_propiedad, cod_servicio, estado_servicio)
  select v_cod, (s->>'cod_servicio')::smallint, s->>'estado_servicio'
  from jsonb_array_elements(coalesce(p_servicios, '[]'::jsonb)) as s
  on conflict (cod_propiedad, cod_servicio) do update
    set estado_servicio = excluded.estado_servicio;

  if p_avaluo is not null then
    insert into public.avaluo (cod_propiedad, fecha_avaluo, valor_avaluo_usd, nivel_acabados)
    values (
      v_cod,
      (p_avaluo->>'fecha_avaluo')::date,
      (p_avaluo->>'valor_avaluo_usd')::decimal(12,2),
      nullif(p_avaluo->>'nivel_acabados', '')
    );
  end if;

  return v_cod;
end;
$$;

revoke all on function public.guardar_propiedad(integer, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_propiedad(integer, jsonb, jsonb, jsonb) to authenticated, service_role;
