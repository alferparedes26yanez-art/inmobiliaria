import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utilidades';
import { Button, IconButton } from './basicos';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md' | 'lg' | 'xl';
  /** En móvil se muestra como hoja inferior en lugar de centrado. */
  hojaEnMovil?: boolean;
}

const anchos = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };

/** Modal de vidrio oscuro. Cierra con Escape o clic en el fondo. */
export function Modal({ abierto, onCerrar, titulo, children, pie, ancho = 'md', hojaEnMovil = true }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alTeclear);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div
      className={cn('fixed inset-0 z-[1200] flex justify-center sm:items-center sm:p-6', hojaEnMovil ? 'items-end' : 'items-center p-4')}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onCerrar} />
      <div
        className={cn(
          'glass relative flex max-h-[92dvh] w-full flex-col overflow-hidden',
          hojaEnMovil ? 'animate-sheet-up rounded-t-[28px] sm:animate-fade-up sm:rounded-3xl' : 'animate-fade-up rounded-3xl',
          anchos[ancho],
        )}
      >
        {hojaEnMovil && <span className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />}
        {titulo && (
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 pb-2 pt-5">
            <h2 className="text-lg font-medium text-text">{titulo}</h2>
            <IconButton icono={X} etiqueta="Cerrar" tamano="sm" onClick={onCerrar} />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {pie && <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border px-6 py-4">{pie}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Confirmación propia (reemplaza a window.confirm). */
export function ModalConfirmar({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  mensaje,
  textoConfirmar = 'Eliminar',
  cargando,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  titulo: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  cargando?: boolean;
}) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="sm"
      hojaEnMovil={false}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button variante="peligro" onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center pt-4 text-center">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-medium text-text">{titulo}</h2>
        <div className="mt-2 text-sm text-muted">{mensaje}</div>
      </div>
    </Modal>
  );
}
