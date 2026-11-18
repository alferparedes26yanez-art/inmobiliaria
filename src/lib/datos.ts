import { useCallback, useEffect, useRef, useState } from 'react';

export const EVENTO_REFRESCAR = 'app:refrescar';

/** Pide a todas las consultas activas que vuelvan a cargar (botón de refrescar, Realtime…). */
export function refrescarTodo() {
  window.dispatchEvent(new Event(EVENTO_REFRESCAR));
}

interface Consulta<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/** Ejecuta una consulta asíncrona y la repite cuando cambian las dependencias o se pide refrescar. */
export function useConsulta<T>(consulta: () => Promise<T>, deps: unknown[]): Consulta<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const ref = useRef(consulta);
  ref.current = consulta;

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    window.addEventListener(EVENTO_REFRESCAR, recargar);
    return () => window.removeEventListener(EVENTO_REFRESCAR, recargar);
  }, [recargar]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    ref.current()
      .then((r) => {
        if (!vigente) return;
        setDatos(r);
        setError(null);
      })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { datos, cargando, error, recargar };
}

/** Lanza el error de Supabase si existe y devuelve los datos. */
export function exigir<T>(respuesta: { data: T | null; error: unknown }): T {
  if (respuesta.error) throw respuesta.error;
  return respuesta.data as T;
}

/** Traduce errores de Postgres/Supabase a mensajes claros en español. */
export function mensajeError(e: unknown): string {
  const err = (e ?? {}) as { code?: string; message?: string; details?: string };
  const mensaje = err.message ?? '';
  switch (err.code) {
    case '23505':
      if (/correo/.test(mensaje + (err.details ?? ''))) return 'Ya existe un registro con ese correo.';
      return 'Ya existe un registro con esos datos.';
    case '23503':
      return 'No se puede completar: hay otros registros que dependen de este dato.';
    case '23514':
      return 'Algún valor no cumple las reglas permitidas (revisa números, fechas y estados).';
    case '23502':
      return 'Falta completar un campo obligatorio.';
    case '22P02':
    case '22003':
      return 'Hay un número con formato inválido o fuera de rango.';
    case '42501':
      return 'No tienes permisos para realizar esta acción.';
    case 'PGRST301':
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }
  if (/failed to fetch|networkerror|load failed/i.test(mensaje)) return 'No hay conexión con el servidor. Revisa tu internet.';
  if (/row-level security/i.test(mensaje)) return 'No tienes permisos para realizar esta acción.';
  // Las funciones RPC del sistema ya devuelven mensajes en español.
  return mensaje || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
