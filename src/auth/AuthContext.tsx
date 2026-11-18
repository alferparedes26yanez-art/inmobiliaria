import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tabla } from '../lib/supabase';

export type UsuarioAdmin = Pick<Tabla<'usuario_admin'>, 'usuario' | 'nombre' | 'apellido' | 'correo' | 'rol'>;

/** cargando: aún no se sabe · sin_sesion: no ha entrado · no_admin: entró pero no está en usuario_admin */
export type EstadoAuth = 'cargando' | 'sin_sesion' | 'no_admin' | 'admin';

interface AuthApi {
  estado: EstadoAuth;
  admin: UsuarioAdmin | null;
  correoSesion: string | null;
  entrar: (correo: string, clave: string) => Promise<string | null>;
  salir: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

function mensajeLogin(mensaje: string): string {
  if (/invalid login credentials/i.test(mensaje)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(mensaje)) return 'Tu correo aún no está confirmado.';
  if (/failed to fetch|network/i.test(mensaje)) return 'No hay conexión con el servidor. Inténtalo de nuevo.';
  if (/rate limit|too many/i.test(mensaje)) return 'Demasiados intentos. Espera un momento e inténtalo otra vez.';
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [admin, setAdmin] = useState<UsuarioAdmin | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSession(nueva));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  // Al cambiar de usuario se consulta su fila en usuario_admin (RLS devuelve vacío si no es admin).
  useEffect(() => {
    if (session === undefined) return;
    if (!userId) {
      setAdmin(null);
      return;
    }
    let vigente = true;
    setAdmin(undefined);
    supabase
      .from('usuario_admin')
      .select('usuario, nombre, apellido, correo, rol')
      .eq('auth_user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (vigente) setAdmin(data ?? null);
      });
    return () => {
      vigente = false;
    };
  }, [userId, session === undefined]);

  const entrar = useCallback(async (correo: string, clave: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
    return error ? mensajeLogin(error.message) : null;
  }, []);

  const salir = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const estado: EstadoAuth =
    session === undefined || (session && admin === undefined) ? 'cargando' : !session ? 'sin_sesion' : admin ? 'admin' : 'no_admin';

  const api = useMemo<AuthApi>(
    () => ({ estado, admin: admin ?? null, correoSesion: session?.user.email ?? null, entrar, salir }),
    [estado, admin, session, entrar, salir],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
