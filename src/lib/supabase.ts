import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** false mientras no existan las variables de entorno (ver .env.example). */
export const supabaseConfigurado = Boolean(url && anonKey);

// Solo se usa la anon key: la seguridad real la aplica RLS en la base de datos.
export const supabase = createClient<Database>(url ?? 'http://localhost:54321', anonKey ?? 'sin-configurar');

export type Tabla<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Vista<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];

export const BUCKET_FOTOS = 'fotos-propiedades';

/** Devuelve la URL pública de una foto: acepta rutas de Storage o URLs completas (seed). */
export function urlFoto(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta).data.publicUrl;
}
