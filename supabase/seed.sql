-- =====================================================================
-- Sistema inmobiliario · Datos de prueba (Ecuador: Quito, Ambato, Ibarra)
-- Se puede ejecutar más de una vez: las filas que ya existen se omiten.
-- Las fechas son relativas al día en que se carga, para que siempre haya
-- citas pasadas y futuras.
-- =====================================================================

-- Sectores -------------------------------------------------------------
insert into public.sector (cod_sector, nombre, ciudad) values
  (1,  'Cumbayá',          'Quito'),
  (2,  'La Carolina',      'Quito'),
  (3,  'González Suárez',  'Quito'),
  (4,  'Tumbaco',          'Quito'),
  (5,  'El Condado',       'Quito'),
  (6,  'Ficoa',            'Ambato'),
  (7,  'Izamba',           'Ambato'),
  (8,  'Miraflores',       'Ambato'),
  (9,  'Caranqui',         'Ibarra'),
  (10, 'Yahuarcocha',      'Ibarra'),
  (11, 'Yacucalle',        'Ibarra'),
  (12, 'La Victoria',      'Ibarra')
on conflict do nothing;

-- Propiedades (tipos: 1 Terreno, 2 Casa, 3 Departamento, 4 Suite) --------
insert into public.propiedad
  (cod_propiedad, nombre_comercial, cod_tipo, cod_sector, direccion, latitud, longitud,
   area_terreno_m2, area_construccion_m2, precio_usd, descripcion, estado, fecha_registro)
values
  (1,  'Casa Jardines de Cumbayá', 2, 1, 'Av. Pampite y Chimborazo, Cumbayá', -0.200450, -78.433120,
   420.00, 260.00, 285000.00,
   'Casa de dos plantas con jardín amplio, cuatro dormitorios, sala de estar y parqueadero cubierto para tres vehículos.',
   'disponible', now() - interval '10 months'),
  (2,  'Departamento Mirador La Carolina', 3, 2, 'Av. República de El Salvador N36-84', -0.181950, -78.481630,
   null, 112.00, 168000.00,
   'Departamento en piso 9 con vista al parque La Carolina, tres dormitorios, balcón y dos parqueaderos.',
   'disponible', now() - interval '8 months'),
  (3,  'Suite Urban González Suárez', 4, 3, 'Av. González Suárez N27-142', -0.201280, -78.476050,
   null, 48.00, 89500.00,
   'Suite moderna con acabados de lujo, vista al valle, gimnasio y áreas comunales en el edificio.',
   'disponible', now() - interval '7 months'),
  (4,  'Terreno Colinas de Tumbaco', 1, 4, 'Calle Gonzalo Pizarro, Tumbaco', -0.212340, -78.401560,
   850.00, null, 96000.00,
   'Terreno plano en urbanización cerrada, listo para construir, con guardianía permanente.',
   'disponible', now() - interval '6 months'),
  (5,  'Casa Villa Ficoa', 2, 6, 'Av. Los Guaytambos y La Delicia, Ficoa', -1.237150, -78.637420,
   300.00, 210.00, 172000.00,
   'Casa familiar en el sector residencial de Ficoa, tres dormitorios, estudio y patio con huerto frutal.',
   'disponible', now() - interval '6 months'),
  (6,  'Terreno Izamba Norte', 1, 7, 'Vía a Píllaro km 2, Izamba', -1.218260, -78.590380,
   600.00, null, 48000.00,
   'Terreno esquinero cerca del aeropuerto de Izamba, ideal para vivienda o bodega.',
   'disponible', now() - interval '5 months'),
  (7,  'Departamento Torres Miraflores', 3, 8, 'Av. Miraflores y Las Dalias', -1.248320, -78.634110,
   null, 95.00, 98000.00,
   'Departamento de tres dormitorios a pocos minutos del centro de Ambato, con bodega y parqueadero.',
   'disponible', now() - interval '5 months'),
  (8,  'Casa Hacienda Caranqui', 2, 9, 'Calle Princesa Paccha, Caranqui', 0.325410, -78.123250,
   380.00, 180.00, 135000.00,
   'Casa de una planta con estilo tradicional, patio central y vista al volcán Imbabura.',
   'disponible', now() - interval '4 months'),
  (9,  'Terreno Vista Yahuarcocha', 1, 10, 'Vía a Yahuarcocha, sector El Mirador', 0.374180, -78.101240,
   1000.00, null, 62000.00,
   'Terreno con vista a la laguna de Yahuarcocha, acceso por vía asfaltada.',
   'disponible', now() - interval '3 months'),
  (10, 'Suite Parque Yacucalle', 4, 11, 'Av. Teodoro Gómez de la Torre y Calixto Miranda', 0.340260, -78.122870,
   null, 42.00, 58000.00,
   'Suite amoblada frente al parque de Yacucalle, perfecta para estudiantes o inversión.',
   'disponible', now() - interval '2 months'),
  (11, 'Casa Altos de El Condado', 2, 5, 'Av. Mariscal Sucre y John F. Kennedy, El Condado', -0.103540, -78.498120,
   250.00, 190.00, 158000.00,
   'Casa en conjunto privado con áreas verdes, tres dormitorios y terraza con vista a la ciudad.',
   'disponible', now() - interval '9 months'),
  (12, 'Suite La Victoria', 4, 12, 'Av. El Retorno y Río Blanco, La Victoria', 0.356120, -78.108430,
   null, 45.00, 54000.00,
   'Suite nueva cerca de la Universidad Técnica del Norte, con parqueadero.',
   'disponible', now() - interval '9 months')
on conflict do nothing;

-- Avalúos (nivel_acabados NULL en terrenos) ------------------------------
insert into public.avaluo (cod_avaluo, cod_propiedad, fecha_avaluo, valor_avaluo_usd, nivel_acabados) values
  (1,  1,  current_date - 300, 268000.00, 'lujo'),
  (2,  1,  current_date - 40,  279500.00, 'lujo'),
  (3,  2,  current_date - 230, 161000.00, 'estándar'),
  (4,  3,  current_date - 200, 86000.00,  'lujo'),
  (5,  4,  current_date - 170, 91000.00,  null),
  (6,  5,  current_date - 170, 165000.00, 'estándar'),
  (7,  6,  current_date - 140, 45500.00,  null),
  (8,  7,  current_date - 140, 94000.00,  'estándar'),
  (9,  8,  current_date - 110, 128000.00, 'básico'),
  (10, 9,  current_date - 80,  59000.00,  null),
  (11, 10, current_date - 50,  55500.00,  'estándar'),
  (12, 11, current_date - 260, 151000.00, 'estándar'),
  (13, 12, current_date - 260, 52000.00,  'básico')
on conflict do nothing;

-- Servicios básicos por propiedad (1 Luz, 2 Agua potable, 3 Alcantarillado)
insert into public.propiedad_servicio (cod_propiedad, cod_servicio, estado_servicio) values
  (1, 1, 'tiene'),    (1, 2, 'tiene'),    (1, 3, 'tiene'),
  (2, 1, 'tiene'),    (2, 2, 'tiene'),    (2, 3, 'tiene'),
  (3, 1, 'tiene'),    (3, 2, 'tiene'),    (3, 3, 'tiene'),
  (4, 1, 'tiene'),    (4, 2, 'tiene'),    (4, 3, 'factible'),
  (5, 1, 'tiene'),    (5, 2, 'tiene'),    (5, 3, 'tiene'),
  (6, 1, 'factible'), (6, 2, 'factible'), (6, 3, 'no_factible'),
  (7, 1, 'tiene'),    (7, 2, 'tiene'),    (7, 3, 'tiene'),
  (8, 1, 'tiene'),    (8, 2, 'tiene'),    (8, 3, 'factible'),
  (9, 1, 'factible'), (9, 2, 'factible'), (9, 3, 'no_factible'),
  (10, 1, 'tiene'),   (10, 2, 'tiene'),   (10, 3, 'tiene'),
  (11, 1, 'tiene'),   (11, 2, 'tiene'),   (11, 3, 'tiene'),
  (12, 1, 'tiene'),   (12, 2, 'tiene'),   (12, 3, 'tiene')
on conflict do nothing;

-- Fotos (URLs de placeholder; las reales se guardan como ruta de Storage) --
insert into public.foto (cod_foto, cod_propiedad, url, es_principal, orden) values
  (1,  1,  'https://picsum.photos/seed/inmo-casa-cumbaya-1/1200/800',   true,  0),
  (2,  1,  'https://picsum.photos/seed/inmo-casa-cumbaya-2/1200/800',   false, 1),
  (3,  1,  'https://picsum.photos/seed/inmo-casa-cumbaya-3/1200/800',   false, 2),
  (4,  2,  'https://picsum.photos/seed/inmo-depto-carolina-1/1200/800', true,  0),
  (5,  2,  'https://picsum.photos/seed/inmo-depto-carolina-2/1200/800', false, 1),
  (6,  2,  'https://picsum.photos/seed/inmo-depto-carolina-3/1200/800', false, 2),
  (7,  3,  'https://picsum.photos/seed/inmo-suite-gonzalez-1/1200/800', true,  0),
  (8,  3,  'https://picsum.photos/seed/inmo-suite-gonzalez-2/1200/800', false, 1),
  (9,  4,  'https://picsum.photos/seed/inmo-terreno-tumbaco-1/1200/800', true,  0),
  (10, 4,  'https://picsum.photos/seed/inmo-terreno-tumbaco-2/1200/800', false, 1),
  (11, 5,  'https://picsum.photos/seed/inmo-casa-ficoa-1/1200/800',     true,  0),
  (12, 5,  'https://picsum.photos/seed/inmo-casa-ficoa-2/1200/800',     false, 1),
  (13, 5,  'https://picsum.photos/seed/inmo-casa-ficoa-3/1200/800',     false, 2),
  (14, 6,  'https://picsum.photos/seed/inmo-terreno-izamba-1/1200/800', true,  0),
  (15, 6,  'https://picsum.photos/seed/inmo-terreno-izamba-2/1200/800', false, 1),
  (16, 7,  'https://picsum.photos/seed/inmo-depto-miraflores-1/1200/800', true,  0),
  (17, 7,  'https://picsum.photos/seed/inmo-depto-miraflores-2/1200/800', false, 1),
  (18, 8,  'https://picsum.photos/seed/inmo-casa-caranqui-1/1200/800',  true,  0),
  (19, 8,  'https://picsum.photos/seed/inmo-casa-caranqui-2/1200/800',  false, 1),
  (20, 8,  'https://picsum.photos/seed/inmo-casa-caranqui-3/1200/800',  false, 2),
  (21, 9,  'https://picsum.photos/seed/inmo-terreno-yahuarcocha-1/1200/800', true,  0),
  (22, 9,  'https://picsum.photos/seed/inmo-terreno-yahuarcocha-2/1200/800', false, 1),
  (23, 10, 'https://picsum.photos/seed/inmo-suite-yacucalle-1/1200/800', true,  0),
  (24, 10, 'https://picsum.photos/seed/inmo-suite-yacucalle-2/1200/800', false, 1),
  (25, 11, 'https://picsum.photos/seed/inmo-casa-condado-1/1200/800',   true,  0),
  (26, 11, 'https://picsum.photos/seed/inmo-casa-condado-2/1200/800',   false, 1),
  (27, 12, 'https://picsum.photos/seed/inmo-suite-victoria-1/1200/800', true,  0),
  (28, 12, 'https://picsum.photos/seed/inmo-suite-victoria-2/1200/800', false, 1)
on conflict do nothing;

-- Clientes (datos ficticios) ----------------------------------------------
insert into public.cliente (cedula, nombre, apellido, telefono, correo, fecha_registro) values
  ('1712345678', 'María',     'Andrade',   '0995550101', 'maria.andrade@example.com',    now() - interval '11 months'),
  ('1723456789', 'Carlos',    'Paredes',   '0995550102', 'carlos.paredes@example.com',   now() - interval '9 months'),
  ('1804567890', 'Gabriela',  'Núñez',     '0985550103', 'gabriela.nunez@example.com',   now() - interval '7 months'),
  ('1805678901', 'Luis',      'Sánchez',   '0985550104', 'luis.sanchez@example.com',     now() - interval '6 months'),
  ('1001234567', 'Verónica',  'Yépez',     '0975550105', 'veronica.yepez@example.com',   now() - interval '4 months'),
  ('1002345678', 'Jorge',     'Benalcázar','0975550106', 'jorge.benalcazar@example.com', now() - interval '4 months'),
  ('1756789012', 'Daniela',   'Cevallos',  '0965550107', 'daniela.cevallos@example.com', now() - interval '3 months'),
  ('1767890123', 'Andrés',    'Guerrero',  '0965550108', 'andres.guerrero@example.com',  now() - interval '1 month'),
  ('1808901234', 'Paola',     'Villacís',  '0995550109', 'paola.villacis@example.com',   now() - interval '3 hours'),
  ('1009012345', 'Sebastián', 'Rosero',    '0985550110', 'sebastian.rosero@example.com', now() - interval '1 hour')
on conflict do nothing;

-- Intereses: todas las etapas del embudo ----------------------------------
-- (el trigger pasa a "reservada" la propiedad con anticipo y a "vendida" las vendidas)
insert into public.interes (cod_interes, cedula, cod_propiedad, etapa, monto_anticipo_usd, fecha_actualizacion) values
  (1,  '1712345678', 1,  'interesado',    null,     now() - interval '5 days'),
  (2,  '1723456789', 2,  'cita_agendada', null,     now() - interval '2 days'),
  (3,  '1804567890', 3,  'cita_agendada', null,     now() - interval '1 day'),
  (4,  '1805678901', 4,  'visitó',        null,     now() - interval '3 days'),
  (5,  '1001234567', 5,  'anticipo',      8600.00,  now() - interval '2 hours'),
  (6,  '1002345678', 7,  'vendido',       5000.00,  now() - interval '4 hours'),
  (7,  '1756789012', 8,  'descartado',    null,     now() - interval '12 days'),
  (8,  '1767890123', 11, 'vendido',       7900.00,  now() - interval '1 month'),
  (9,  '1712345678', 12, 'vendido',       2700.00,  now() - interval '4 months'),
  (10, '1009012345', 9,  'interesado',    null,     now() - interval '1 hour'),
  (11, '1808901234', 6,  'cita_agendada', null,     now() - interval '3 hours'),
  (12, '1756789012', 10, 'interesado',    null,     now() - interval '10 days'),
  (13, '1805678901', 1,  'visitó',        null,     now() - interval '20 days'),
  (14, '1723456789', 9,  'descartado',    null,     now() - interval '45 days')
on conflict do nothing;

-- Citas pasadas y futuras ---------------------------------------------------
insert into public.cita (cod_cita, cod_interes, fecha, hora, estado_cita, fecha_creacion) values
  (1,  2,  current_date + 1,  '10:00', 'agendada',   now() - interval '2 days'),
  (2,  3,  current_date + 2,  '15:00', 'agendada',   now() - interval '1 day'),
  (3,  11, current_date + 3,  '11:00', 'agendada',   now() - interval '3 hours'),
  (4,  4,  current_date - 3,  '10:00', 'realizada',  now() - interval '9 days'),
  (5,  5,  current_date - 8,  '14:00', 'realizada',  now() - interval '15 days'),
  (6,  7,  current_date - 12, '11:00', 'no_asistió', now() - interval '18 days'),
  (7,  14, current_date - 45, '16:00', 'cancelada',  now() - interval '50 days'),
  (8,  13, current_date - 20, '09:00', 'realizada',  now() - interval '26 days'),
  (9,  6,  current_date - 15, '15:00', 'realizada',  now() - interval '22 days'),
  (10, 8,  current_date - 75, '10:00', 'realizada',  now() - interval '82 days'),
  (11, 9,  current_date - 135, '17:00', 'realizada', now() - interval '140 days'),
  (12, 1,  current_date + 5,  '16:00', 'agendada',   now() - interval '5 hours')
on conflict do nothing;

-- Notificaciones de WhatsApp --------------------------------------------------
insert into public.notificacion_whatsapp (cod_notificacion, cod_cita, mensaje, fecha_envio, estado_envio) values
  (1,  1,  'Hola Carlos, tu visita a "Departamento Mirador La Carolina" quedó agendada. ¡Te esperamos!', now() - interval '2 days', 'enviado'),
  (2,  1,  'Recordatorio: Carlos, mañana tienes tu visita a "Departamento Mirador La Carolina" a las 10:00.', now() - interval '1 hour', 'enviado'),
  (3,  2,  'Hola Gabriela, tu visita a "Suite Urban González Suárez" quedó agendada. ¡Te esperamos!', now() - interval '1 day', 'enviado'),
  (4,  3,  'Hola Paola, tu visita a "Terreno Izamba Norte" quedó agendada. ¡Te esperamos!', null, 'pendiente'),
  (5,  4,  'Hola Luis, tu visita a "Terreno Colinas de Tumbaco" quedó agendada. ¡Te esperamos!', now() - interval '9 days', 'enviado'),
  (6,  4,  'Recordatorio: Luis, mañana tienes tu visita a "Terreno Colinas de Tumbaco" a las 10:00.', now() - interval '4 days', 'enviado'),
  (7,  5,  'Hola Verónica, tu visita a "Casa Villa Ficoa" quedó agendada. ¡Te esperamos!', now() - interval '15 days', 'enviado'),
  (8,  6,  'Hola Daniela, tu visita a "Casa Hacienda Caranqui" quedó agendada. ¡Te esperamos!', now() - interval '18 days', 'enviado'),
  (9,  6,  'Recordatorio: Daniela, mañana tienes tu visita a "Casa Hacienda Caranqui" a las 11:00.', now() - interval '13 days', 'fallido'),
  (10, 7,  'Hola Carlos, tu visita a "Terreno Vista Yahuarcocha" quedó agendada. ¡Te esperamos!', now() - interval '50 days', 'enviado'),
  (11, 8,  'Hola Luis, tu visita a "Casa Jardines de Cumbayá" quedó agendada. ¡Te esperamos!', now() - interval '26 days', 'enviado'),
  (12, 9,  'Hola Jorge, tu visita a "Departamento Torres Miraflores" quedó agendada. ¡Te esperamos!', now() - interval '22 days', 'enviado'),
  (13, 10, 'Hola Andrés, tu visita a "Casa Altos de El Condado" quedó agendada. ¡Te esperamos!', now() - interval '82 days', 'enviado'),
  (14, 11, 'Hola María, tu visita a "Suite La Victoria" quedó agendada. ¡Te esperamos!', now() - interval '140 days', 'enviado'),
  (15, 12, 'Hola María, tu visita a "Casa Jardines de Cumbayá" quedó agendada. ¡Te esperamos!', now() - interval '5 hours', 'enviado')
on conflict do nothing;

-- Seguimientos: solo si ya existe un usuario admin (ver README) -----------------
insert into public.seguimiento_cliente (cod_seguimiento, cedula, usuario, fecha, medio, mensaje)
select s.cod_seguimiento, s.cedula, u.usuario, s.fecha, s.medio, s.mensaje
from (values
  (1, '1712345678', now() - interval '5 days',  'WhatsApp', 'Se envió la ficha de la casa en Cumbayá y el plan de financiamiento.'),
  (2, '1805678901', now() - interval '3 days',  'llamada',  'Le gustó el terreno; consulta con su familia y responde esta semana.'),
  (3, '1001234567', now() - interval '2 hours', 'WhatsApp', 'Confirmó la transferencia del anticipo.'),
  (4, '1756789012', now() - interval '40 days', 'correo',   'Se enviaron alternativas en Ibarra después de que no asistió a la cita.')
) as s(cod_seguimiento, cedula, fecha, medio, mensaje)
cross join (select usuario from public.usuario_admin order by usuario limit 1) u
on conflict do nothing;

-- Deja las secuencias después del último código cargado ---------------------------
select setval(pg_get_serial_sequence('public.sector', 'cod_sector'),
              (select max(cod_sector) from public.sector));
select setval(pg_get_serial_sequence('public.propiedad', 'cod_propiedad'),
              (select max(cod_propiedad) from public.propiedad));
select setval(pg_get_serial_sequence('public.avaluo', 'cod_avaluo'),
              (select max(cod_avaluo) from public.avaluo));
select setval(pg_get_serial_sequence('public.foto', 'cod_foto'),
              (select max(cod_foto) from public.foto));
select setval(pg_get_serial_sequence('public.interes', 'cod_interes'),
              (select max(cod_interes) from public.interes));
select setval(pg_get_serial_sequence('public.cita', 'cod_cita'),
              (select max(cod_cita) from public.cita));
select setval(pg_get_serial_sequence('public.notificacion_whatsapp', 'cod_notificacion'),
              (select max(cod_notificacion) from public.notificacion_whatsapp));
select setval(pg_get_serial_sequence('public.seguimiento_cliente', 'cod_seguimiento'),
              greatest((select max(cod_seguimiento) from public.seguimiento_cliente), 1));

-- =====================================================================
-- Propiedades en Tungurahua (el mapa público está limitado a la provincia).
-- Va después de ajustar las secuencias porque usa códigos automáticos.
-- Se busca por nombre, así que se puede ejecutar más de una vez.
-- =====================================================================
insert into public.sector (nombre, ciudad) values
  ('Huachi Chico', 'Ambato'),
  ('Atocha',       'Ambato'),
  ('Ingahurco',    'Ambato'),
  ('Centro',       'Baños de Agua Santa'),
  ('La Matriz',    'Pelileo'),
  ('Centro',       'Patate'),
  ('Centro',       'Píllaro')
on conflict (nombre, ciudad) do nothing;

insert into public.propiedad
  (nombre_comercial, cod_tipo, cod_sector, direccion, latitud, longitud,
   area_terreno_m2, area_construccion_m2, precio_usd, descripcion, estado, fecha_registro)
select v.nombre, v.tipo, s.cod_sector, v.direccion, v.lat, v.lng,
       v.terreno, v.construccion, v.precio, v.descripcion, 'disponible', now() - v.antiguedad
from (values
  ('Casa Moderna Huachi Chico', 2, 'Huachi Chico', 'Ambato',
   'Av. Atahualpa y Río Guayllabamba, Huachi Chico', -1.269040, -78.629150,
   200.00, 165.00, 118000.00,
   'Casa de dos plantas con tres dormitorios, patio posterior y garaje, cerca de colegios y del mercado de Huachi.',
   interval '40 days'),
  ('Departamento Atocha Park', 3, 'Atocha', 'Ambato',
   'Av. Rodrigo Pachano y Montalvo, Atocha', -1.227480, -78.615300,
   null, 88.00, 79500.00,
   'Departamento de dos dormitorios con balcón, frente a la Quinta de Mera y a minutos del centro.',
   interval '25 days'),
  ('Suite Centro Ingahurco', 4, 'Ingahurco', 'Ambato',
   'Av. Los Shyris y Guayaquil, Ingahurco', -1.240150, -78.619520,
   null, 46.00, 49000.00,
   'Suite nueva y luminosa, ideal para estudiantes de la Universidad Técnica de Ambato o como inversión.',
   interval '12 days'),
  ('Casa Vista al Tungurahua', 2, 'Centro', 'Baños de Agua Santa',
   'Calle Montalvo y 16 de Diciembre, Baños', -1.399030, -78.418040,
   320.00, 190.00, 145000.00,
   'Casa con jardín y terraza con vista directa al volcán Tungurahua, a cinco cuadras del parque central de Baños.',
   interval '60 days'),
  ('Casa Familiar Pelileo', 2, 'La Matriz', 'Pelileo',
   'Calle Padre Chacón y Mera, Pelileo', -1.330250, -78.544010,
   260.00, 150.00, 92000.00,
   'Casa de una planta con amplio patio, cerca de la avenida del jean y de la iglesia matriz.',
   interval '30 days'),
  ('Terreno Valle de Patate', 1, 'Centro', 'Patate',
   'Vía Patate – Leito, sector La Delicia', -1.315020, -78.509170,
   1500.00, null, 38000.00,
   'Terreno plano en el valle de Patate, con clima templado, ideal para casa de campo o cultivo de frutales.',
   interval '20 days'),
  ('Terreno Agrícola Píllaro', 1, 'Centro', 'Píllaro',
   'Vía a San Miguelito, Píllaro', -1.166040, -78.544210,
   2400.00, null, 42000.00,
   'Terreno con acceso por vía lastrada y agua de riego, a diez minutos del centro de Píllaro.',
   interval '8 days')
) as v(nombre, tipo, sector, ciudad, direccion, lat, lng, terreno, construccion, precio, descripcion, antiguedad)
join public.sector s on s.nombre = v.sector and s.ciudad = v.ciudad
where not exists (select 1 from public.propiedad p where p.nombre_comercial = v.nombre);

insert into public.foto (cod_propiedad, url, es_principal, orden)
select p.cod_propiedad, 'https://picsum.photos/seed/' || f.semilla || '/1200/800', f.orden = 0, f.orden
from (values
  ('Casa Moderna Huachi Chico', 'inmo-tg-huachi-1', 0),
  ('Casa Moderna Huachi Chico', 'inmo-tg-huachi-2', 1),
  ('Casa Moderna Huachi Chico', 'inmo-tg-huachi-3', 2),
  ('Departamento Atocha Park', 'inmo-tg-atocha-1', 0),
  ('Departamento Atocha Park', 'inmo-tg-atocha-2', 1),
  ('Suite Centro Ingahurco', 'inmo-tg-ingahurco-1', 0),
  ('Suite Centro Ingahurco', 'inmo-tg-ingahurco-2', 1),
  ('Casa Vista al Tungurahua', 'inmo-tg-banos-1', 0),
  ('Casa Vista al Tungurahua', 'inmo-tg-banos-2', 1),
  ('Casa Vista al Tungurahua', 'inmo-tg-banos-3', 2),
  ('Casa Familiar Pelileo', 'inmo-tg-pelileo-1', 0),
  ('Casa Familiar Pelileo', 'inmo-tg-pelileo-2', 1),
  ('Terreno Valle de Patate', 'inmo-tg-patate-1', 0),
  ('Terreno Valle de Patate', 'inmo-tg-patate-2', 1),
  ('Terreno Agrícola Píllaro', 'inmo-tg-pillaro-1', 0),
  ('Terreno Agrícola Píllaro', 'inmo-tg-pillaro-2', 1)
) as f(nombre, semilla, orden)
join public.propiedad p on p.nombre_comercial = f.nombre
where not exists (select 1 from public.foto x where x.cod_propiedad = p.cod_propiedad and x.url like '%/' || f.semilla || '/%');

-- Servicios: luz, agua potable, alcantarillado
insert into public.propiedad_servicio (cod_propiedad, cod_servicio, estado_servicio)
select p.cod_propiedad, s.cod_servicio, s.estado
from (values
  ('Casa Moderna Huachi Chico', 'tiene', 'tiene', 'tiene'),
  ('Departamento Atocha Park', 'tiene', 'tiene', 'tiene'),
  ('Suite Centro Ingahurco', 'tiene', 'tiene', 'tiene'),
  ('Casa Vista al Tungurahua', 'tiene', 'tiene', 'tiene'),
  ('Casa Familiar Pelileo', 'tiene', 'tiene', 'factible'),
  ('Terreno Valle de Patate', 'factible', 'factible', 'no_factible'),
  ('Terreno Agrícola Píllaro', 'tiene', 'factible', 'no_factible')
) as v(nombre, luz, agua, alcantarillado)
join public.propiedad p on p.nombre_comercial = v.nombre
cross join lateral (values (1::smallint, v.luz), (2::smallint, v.agua), (3::smallint, v.alcantarillado)) as s(cod_servicio, estado)
on conflict (cod_propiedad, cod_servicio) do nothing;

insert into public.avaluo (cod_propiedad, fecha_avaluo, valor_avaluo_usd, nivel_acabados)
select p.cod_propiedad, current_date - v.dias, v.valor, v.acabados
from (values
  ('Casa Moderna Huachi Chico', 35, 112000.00, 'estándar'),
  ('Departamento Atocha Park', 20, 76000.00, 'estándar'),
  ('Suite Centro Ingahurco', 10, 47500.00, 'lujo'),
  ('Casa Vista al Tungurahua', 55, 139000.00, 'lujo'),
  ('Casa Familiar Pelileo', 28, 88000.00, 'básico'),
  ('Terreno Valle de Patate', 18, 36000.00, null),
  ('Terreno Agrícola Píllaro', 6, 40000.00, null)
) as v(nombre, dias, valor, acabados)
join public.propiedad p on p.nombre_comercial = v.nombre
where not exists (select 1 from public.avaluo a where a.cod_propiedad = p.cod_propiedad);

-- Ofertas especiales del panel público (sobre propiedades de Tungurahua) ----------
insert into public.oferta_especial
  (titulo, descripcion, etiqueta, cod_propiedad, precio_oferta_usd, fecha_inicio, fecha_fin, activa, orden)
select v.titulo, v.descripcion, v.etiqueta, p.cod_propiedad, v.precio, current_date, current_date + v.dias, true, v.orden
from (values
  ('Rebaja en Casa Vista al Tungurahua',
   'Jardín y terraza con vista directa al volcán, a cinco cuadras del parque de Baños. Precio especial por tiempo limitado.',
   'Oferta especial', 'Casa Vista al Tungurahua', 134900.00, 20, 0),
  ('Suite lista para estrenar en Ambato',
   'Suite nueva cerca de la Universidad Técnica de Ambato, ideal para estudiantes o inversión.',
   'Nuevo precio', 'Suite Centro Ingahurco', 45500.00, 30, 1)
) as v(titulo, descripcion, etiqueta, nombre, precio, dias, orden)
join public.propiedad p on p.nombre_comercial = v.nombre
where not exists (select 1 from public.oferta_especial o where o.titulo = v.titulo);
