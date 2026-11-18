import { z } from 'zod';
import { exigir } from '../../lib/datos';
import { supabase, urlFoto } from '../../lib/supabase';
import { ZONA_HORARIA } from '../../lib/utilidades';

/** Propiedades disponibles con todo lo que muestra el mapa y la ficha (el RLS ya filtra por estado). */
export async function cargarPropiedadesPublicas() {
  return exigir(
    await supabase
      .from('propiedad')
      .select(
        '*, tipo_propiedad(nombre), sector(nombre, ciudad), foto(cod_foto, url, es_principal, orden), propiedad_servicio(estado_servicio, servicio_basico(nombre)), avaluo(nivel_acabados, fecha_avaluo)',
      )
      .eq('estado', 'disponible')
      .order('nombre_comercial'),
  );
}
export type PropiedadPublica = Awaited<ReturnType<typeof cargarPropiedadesPublicas>>[number];

/** Ofertas vigentes (el RLS ya filtra activas, en fecha y con propiedad disponible). */
export async function cargarOfertasPublicas() {
  return exigir(
    await supabase
      .from('oferta_especial')
      .select('cod_oferta, titulo, descripcion, etiqueta, cod_propiedad, precio_oferta_usd, fecha_fin')
      .order('orden')
      .order('fecha_registro', { ascending: false }),
  );
}
export type OfertaPublica = Awaited<ReturnType<typeof cargarOfertasPublicas>>[number];

export function fotosOrdenadas(p: PropiedadPublica): string[] {
  return [...p.foto]
    .sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || a.orden - b.orden)
    .map((f) => urlFoto(f.url))
    .filter((u): u is string => Boolean(u));
}

export function nivelAcabados(p: PropiedadPublica): string | null {
  const ultimo = [...p.avaluo].sort((a, b) => b.fecha_avaluo.localeCompare(a.fecha_avaluo))[0];
  return ultimo?.nivel_acabados ?? null;
}

export const RANGOS_PRECIO = [
  { clave: '', texto: 'Cualquier precio', min: 0, max: Infinity },
  { clave: 'a', texto: 'Hasta $75.000', min: 0, max: 75_000 },
  { clave: 'b', texto: '$75.000 – $150.000', min: 75_000, max: 150_000 },
  { clave: 'c', texto: 'Más de $150.000', min: 150_000, max: Infinity },
];

/** Bloques de visita: de 09:00 a 17:00 (la última termina a las 18:00). */
export const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

/** Hora actual en Ecuador (0–23). */
export function horaActualEcuador(): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: ZONA_HORARIA, hour: '2-digit', hour12: false }).format(new Date()));
}

/** Mismos dominios que los CHECK de la base de datos, con mensajes en español. */
export const esquemaReserva = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre (mínimo 2 letras).').max(60, 'El nombre es demasiado largo.'),
  apellido: z.string().trim().min(2, 'Escribe tu apellido (mínimo 2 letras).').max(60, 'El apellido es demasiado largo.'),
  cedula: z.string().trim().regex(/^[0-9]{10}$/, 'La cédula debe tener exactamente 10 dígitos.'),
  telefono: z.string().trim().regex(/^09[0-9]{8}$/, 'El teléfono debe tener 10 dígitos y empezar con 09.'),
  correo: z
    .string()
    .trim()
    .max(120, 'El correo es demasiado largo.')
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Escribe un correo electrónico válido.'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha de tu visita.'),
  hora: z.string().regex(/^\d{2}:00$/, 'Elige un horario disponible.'),
});
export type DatosReserva = z.infer<typeof esquemaReserva>;
