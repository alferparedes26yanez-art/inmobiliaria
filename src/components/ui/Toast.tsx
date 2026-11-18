import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../lib/utilidades';

type TipoToast = 'exito' | 'error' | 'info';

interface ToastItem {
  id: number;
  tipo: TipoToast;
  titulo: string;
  detalle?: string;
}

interface ToastApi {
  exito: (titulo: string, detalle?: string) => void;
  error: (titulo: string, detalle?: string) => void;
  info: (titulo: string, detalle?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const estilos: Record<TipoToast, { icono: typeof Info; color: string }> = {
  exito: { icono: CheckCircle2, color: 'text-success' },
  error: { icono: AlertCircle, color: 'text-danger' },
  info: { icono: Info, color: 'text-primary' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const siguienteId = useRef(1);

  const quitar = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const mostrar = useCallback(
    (tipo: TipoToast, titulo: string, detalle?: string) => {
      const id = siguienteId.current++;
      setToasts((t) => [...t.slice(-3), { id, tipo, titulo, detalle }]);
      window.setTimeout(() => quitar(id), tipo === 'error' ? 7000 : 4500);
    },
    [quitar],
  );

  const api = useMemo<ToastApi>(
    () => ({
      exito: (t, d) => mostrar('exito', t, d),
      error: (t, d) => mostrar('error', t, d),
      info: (t, d) => mostrar('info', t, d),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[1300] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end">
        {toasts.map((t) => {
          const { icono: Icono, color } = estilos[t.tipo];
          return (
            <div
              key={t.id}
              role="status"
              className="glass pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-3xl px-4 py-3"
            >
              <Icono className={cn('mt-0.5 h-5 w-5 shrink-0', color)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">{t.titulo}</p>
                {t.detalle && <p className="mt-0.5 text-[13px] text-muted">{t.detalle}</p>}
              </div>
              <button type="button" aria-label="Cerrar aviso" onClick={() => quitar(t.id)} className="text-muted transition hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
