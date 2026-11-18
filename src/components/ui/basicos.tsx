import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn, iniciales } from '../../lib/utilidades';

/* ---------------------------------------------------------------- Tarjeta */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Muestra el botón circular ↗ en la esquina superior derecha. */
  onAbrir?: () => void;
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  acciones?: ReactNode;
}

export function Card({ className, children, titulo, subtitulo, acciones, onAbrir, ...rest }: CardProps) {
  const conCabecera = titulo || acciones || onAbrir;
  return (
    <div className={cn('card p-5 sm:p-6', className)} {...rest}>
      {conCabecera && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h3 className="truncate text-[17px] font-medium text-text">{titulo}</h3>}
            {subtitulo && <p className="mt-0.5 text-[13px] text-muted">{subtitulo}</p>}
          </div>
          <div className="flex min-w-0 max-w-full items-center gap-2">
            {acciones}
            {onAbrir && <BotonFlecha onClick={onAbrir} />}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Botones */

type Variante = 'primario' | 'secundario' | 'fantasma' | 'blanco' | 'peligro';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: 'sm' | 'md' | 'lg';
  icono?: LucideIcon;
  cargando?: boolean;
}

const variantes: Record<Variante, string> = {
  primario: 'bg-primary-grad text-white shadow-primary hover:brightness-110',
  secundario: 'bg-surface-2 text-text border border-border hover:bg-surface-3',
  fantasma: 'text-muted hover:bg-surface-2 hover:text-text',
  blanco: 'bg-white text-[#1E1511] hover:bg-white/90',
  peligro: 'bg-danger/15 text-danger border border-danger/25 hover:bg-danger/25',
};

const tamanos = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-[15px]',
};

export function Button({
  variante = 'primario',
  tamano = 'md',
  icono: Icono,
  cargando,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variantes[variante],
        tamanos[tamano],
        className,
      )}
      {...rest}
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : Icono && <Icono className="h-4 w-4" />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icono: LucideIcon;
  etiqueta: string;
  activo?: boolean;
  punto?: boolean;
  tamano?: 'sm' | 'md';
}

/** Botón de ícono circular con fondo surface-2. */
export function IconButton({ icono: Icono, etiqueta, activo, punto, tamano = 'md', className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full border border-border transition',
        'active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        tamano === 'md' ? 'h-11 w-11' : 'h-9 w-9',
        activo ? 'bg-primary-grad text-white shadow-primary' : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-text',
        className,
      )}
      {...rest}
    >
      <Icono className={tamano === 'md' ? 'h-[18px] w-[18px]' : 'h-4 w-4'} />
      {punto && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-surface-2" />}
    </button>
  );
}

/** Botón circular pequeño con flecha ↗ de las tarjetas de estadística. */
export function BotonFlecha({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Ver detalle"
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-muted transition',
        'hover:bg-surface-3 hover:text-text',
        className,
      )}
      {...rest}
    >
      <ArrowUpRight className="h-4 w-4" />
    </button>
  );
}

/* ---------------------------------------------------------------- Badges */

/** Badge de variación: verde con ↑ o rojo con ↓, más el texto de comparación. */
export function BadgePorcentaje({ valor, texto = 'vs mes anterior' }: { valor: number | null; texto?: string }) {
  if (valor == null) {
    return <span className="text-xs text-muted">Sin datos del periodo anterior</span>;
  }
  const positivo = valor >= 0;
  const Flecha = positivo ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium',
          positivo ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
        )}
      >
        <Flecha className="h-3 w-3" />
        {Math.abs(valor).toLocaleString('es-EC', { maximumFractionDigits: 1 })}%
      </span>
      {texto}
    </span>
  );
}

export type Tono = 'naranja' | 'verde' | 'rojo' | 'neutro';

const tonos: Record<Tono, string> = {
  naranja: 'bg-primary/15 text-primary',
  verde: 'bg-success/15 text-success',
  rojo: 'bg-danger/15 text-danger',
  neutro: 'bg-white/[0.07] text-muted',
};

export function Pildora({ tono = 'neutro', children, className }: { tono?: Tono; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium', tonos[tono], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Estados del dominio -> texto y color (naranja pendiente, verde hecho, rojo fallido). */
const ESTADOS: Record<string, { texto: string; tono: Tono }> = {
  // cita
  agendada: { texto: 'Agendada', tono: 'naranja' },
  realizada: { texto: 'Realizada', tono: 'verde' },
  cancelada: { texto: 'Cancelada', tono: 'rojo' },
  'no_asistió': { texto: 'No asistió', tono: 'rojo' },
  // etapa del embudo
  interesado: { texto: 'Interesado', tono: 'neutro' },
  cita_agendada: { texto: 'Cita agendada', tono: 'naranja' },
  'visitó': { texto: 'Visitó', tono: 'verde' },
  anticipo: { texto: 'Anticipo', tono: 'naranja' },
  vendido: { texto: 'Vendido', tono: 'verde' },
  descartado: { texto: 'Descartado', tono: 'rojo' },
  // envío de WhatsApp
  pendiente: { texto: 'Pendiente', tono: 'naranja' },
  enviado: { texto: 'Enviado', tono: 'verde' },
  fallido: { texto: 'Fallido', tono: 'rojo' },
  // propiedad
  disponible: { texto: 'Disponible', tono: 'verde' },
  reservada: { texto: 'Reservada', tono: 'naranja' },
  vendida: { texto: 'Vendida', tono: 'neutro' },
  inactiva: { texto: 'Inactiva', tono: 'rojo' },
  // servicio básico
  tiene: { texto: 'Tiene', tono: 'verde' },
  factible: { texto: 'Factible', tono: 'naranja' },
  no_factible: { texto: 'No factible', tono: 'rojo' },
};

export function textoEstado(estado: string): string {
  return ESTADOS[estado]?.texto ?? estado;
}

export function PildoraEstado({ estado, className }: { estado: string; className?: string }) {
  const e = ESTADOS[estado] ?? { texto: estado, tono: 'neutro' as Tono };
  return (
    <Pildora tono={e.tono} className={className}>
      {e.texto}
    </Pildora>
  );
}

/* ---------------------------------------------------------------- Avatar */

const fondosAvatar = ['bg-[#4A2E1C]', 'bg-[#3B2A45]', 'bg-[#1F3D36]', 'bg-[#4A3A1C]', 'bg-[#2B3550]'];

export function Avatar({
  nombre,
  apellido = '',
  foto,
  tamano = 'md',
  className,
}: {
  nombre: string;
  apellido?: string;
  foto?: string | null;
  tamano?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const medidas = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-base' }[tamano];
  const semilla = [...(nombre + apellido)].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (foto) {
    return <img src={foto} alt="" className={cn('shrink-0 rounded-full object-cover', medidas, className)} />;
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium text-text ring-1 ring-white/10',
        fondosAvatar[semilla % fondosAvatar.length],
        medidas,
        className,
      )}
    >
      {iniciales(nombre, apellido)}
    </span>
  );
}

/* ---------------------------------------------------------------- Listas */

/** Fila redondeada tipo "Recent Transactions": avatar, nombre, detalle y valor a la derecha. */
export function FilaLista({
  avatar,
  titulo,
  detalle,
  derecha,
  onClick,
  className,
}: {
  avatar?: ReactNode;
  titulo: ReactNode;
  detalle?: ReactNode;
  derecha?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Etiqueta = onClick ? 'button' : 'div';
  return (
    <Etiqueta
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl bg-surface-2/70 p-3 text-left transition',
        onClick && 'hover:bg-surface-3',
        className,
      )}
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{titulo}</p>
        {detalle && <p className="mt-0.5 truncate text-xs text-muted">{detalle}</p>}
      </div>
      {derecha && <div className="shrink-0 text-right text-sm">{derecha}</div>}
    </Etiqueta>
  );
}

/* ---------------------------------------------------------------- Segmentado */

export function Segmentado<T extends string | number>({
  opciones,
  valor,
  onCambio,
  className,
}: {
  opciones: Array<{ valor: T; texto: string }>;
  valor: T;
  onCambio: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface-2/60 p-1', className)}>
      {opciones.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          onClick={() => onCambio(o.valor)}
          className={cn(
            'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition',
            o.valor === valor ? 'bg-primary-grad text-white shadow-primary' : 'text-muted hover:text-text',
          )}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- KPI */

export function TarjetaKpi({
  icono: Icono,
  etiqueta,
  valor,
  variacion,
  textoVariacion,
  onAbrir,
}: {
  icono: LucideIcon;
  etiqueta: string;
  valor: ReactNode;
  variacion: number | null;
  textoVariacion?: string;
  onAbrir?: () => void;
}) {
  return (
    <div className="card flex flex-col justify-between gap-5 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-primary ring-1 ring-white/5">
            <Icono className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[13px] text-muted">{etiqueta}</span>
        </div>
        <BotonFlecha onClick={onAbrir} />
      </div>
      <div>
        <p className="text-kpi font-light text-text">{valor}</p>
        <div className="mt-2">
          <BadgePorcentaje valor={variacion} texto={textoVariacion} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Estados */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function EstadoVacio({
  icono: Icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted ring-1 ring-white/5">
        <Icono className="h-6 w-6" />
      </span>
      <p className="text-[15px] font-medium text-text">{titulo}</p>
      {descripcion && <p className="mt-1 max-w-sm text-[13px] text-muted">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

/** Tarjeta promocional: degradado naranja, texto grande y botón blanco en píldora. */
export function TarjetaPromo({
  titulo,
  texto,
  accion,
  onAccion,
}: {
  titulo: string;
  texto?: string;
  accion: string;
  onAccion?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-promo-grad p-6 shadow-primary">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-black/20 blur-2xl" />
      <p className="relative max-w-[16ch] text-[26px] font-medium leading-tight text-white">{titulo}</p>
      {texto && <p className="relative mt-2 max-w-xs text-[13px] text-white/80">{texto}</p>}
      <Button variante="blanco" className="relative mt-5" onClick={onAccion}>
        {accion}
      </Button>
    </div>
  );
}
