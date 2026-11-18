import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Lock, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { RoomiLogo } from '../../components/RoomiLogo';
import { Button } from '../../components/ui/basicos';
import { supabaseConfigurado } from '../../lib/supabase';

export default function Login() {
  const { estado, entrar } = useAuth();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (estado === 'admin' || estado === 'no_admin') return <Navigate to="/admin" replace />;

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !clave) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setEnviando(true);
    setError(await entrar(correo, clave));
    setEnviando(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-5">
      {/* Resplandor naranja de fondo */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-primary-to/20 blur-[120px]" />

      <form onSubmit={alEnviar} className="glass relative w-full max-w-[420px] animate-fade-up rounded-[28px] p-7 sm:p-9" noValidate>
        <RoomiLogo className="text-[34px]" />
        <h1 className="mt-5 text-[28px] font-light leading-tight text-text">Panel de administración</h1>
        <p className="mt-1.5 text-sm text-muted">Ingresa con tu cuenta para gestionar propiedades, citas y clientes.</p>

        {!supabaseConfigurado && (
          <p className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-[13px] text-danger">
            Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (revisa .env.example).
          </p>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="etiqueta" htmlFor="correo">Correo</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="correo"
                type="email"
                autoComplete="username"
                className="campo pl-11"
                placeholder="tu@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="etiqueta" htmlFor="clave">Contraseña</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="clave"
                type="password"
                autoComplete="current-password"
                className="campo pl-11"
                placeholder="••••••••"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 flex items-center gap-2 text-[13px] text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <Button type="submit" tamano="lg" icono={LogIn} cargando={enviando || estado === 'cargando'} className="mt-6 w-full">
          Iniciar sesión
        </Button>

        <Link to="/" className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-muted transition hover:text-text">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al mapa de propiedades
        </Link>
      </form>
    </div>
  );
}
