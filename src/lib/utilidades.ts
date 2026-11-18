export const ZONA_HORARIA = 'America/Guayaquil';

/** Une clases de Tailwind ignorando valores vacíos. */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(' ');
}

const fmtUsd = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const fmtUsdDecimales = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
const fmtNumero = new Intl.NumberFormat('es-EC');

export function usd(valor: number | null | undefined, decimales = false): string {
  if (valor == null) return '—';
  return (decimales ? fmtUsdDecimales : fmtUsd).format(valor);
}

export function numero(valor: number | null | undefined): string {
  return valor == null ? '—' : fmtNumero.format(valor);
}

/** Convierte 'YYYY-MM-DD' (columna date) en Date local sin corrimiento de zona. */
export function fechaLocal(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function fechaCorta(iso: string): string {
  return fechaLocal(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

export function fechaLarga(iso: string): string {
  return fechaLocal(iso).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Fecha y hora de un timestamptz, mostrada en hora de Ecuador. */
export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-EC', {
    timeZone: ZONA_HORARIA,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** '10:00:00' -> '10:00' */
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

/** Fecha de hoy en Ecuador como 'YYYY-MM-DD'. */
export function hoyEcuador(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());
}

const aIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Suma días a una fecha 'YYYY-MM-DD'. */
export function sumarDias(iso: string, dias: number): string {
  const d = fechaLocal(iso);
  d.setDate(d.getDate() + dias);
  return aIso(d);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function lunesDe(iso: string): string {
  const d = fechaLocal(iso);
  return sumarDias(iso, -((d.getDay() + 6) % 7));
}

/** "hace 3 días", "hoy", etc. a partir de un timestamptz. */
export function haceCuanto(iso: string | null | undefined): string {
  if (!iso) return 'Sin contacto';
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 30) return `Hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
}

/** 0991234567 -> 593991234567 (formato internacional para wa.me). */
export function telefonoInternacional(telefono: string): string {
  return '593' + telefono.trim().replace(/^0/, '');
}

export function iniciales(nombre: string, apellido = ''): string {
  const a = nombre.trim().charAt(0);
  const b = apellido.trim().charAt(0) || nombre.trim().split(/\s+/)[1]?.charAt(0) || '';
  return (a + b).toUpperCase();
}
