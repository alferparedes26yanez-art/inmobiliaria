import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Building2, CalendarDays, KanbanSquare, LayoutGrid, LogOut, Moon, RefreshCw, Search, Settings, Tag, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utilidades';
import { Avatar, IconButton } from '../ui/basicos';

interface ItemNav {
  a: string;
  texto: string;
  icono: LucideIcon;
  exacto?: boolean;
}

const NAVEGACION: ItemNav[] = [
  { a: '/admin', texto: 'Dashboard', icono: LayoutGrid, exacto: true },
  { a: '/admin/propiedades', texto: 'Propiedades', icono: Building2 },
  { a: '/admin/embudo', texto: 'Embudo de ventas', icono: KanbanSquare },
  { a: '/admin/citas', texto: 'Citas', icono: CalendarDays },
  { a: '/admin/clientes', texto: 'Clientes', icono: Users },
  { a: '/admin/ofertas', texto: 'Ofertas especiales', icono: Tag },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-grad shadow-primary', className)}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#0E0A08" aria-hidden="true">
        <path d="M3 11.2 12 3l9 8.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    </span>
  );
}

/* Sidebar vertical angosta (escritorio) */
function Sidebar({ onSalir }: { onSalir?: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[84px] flex-col items-center border-r border-border bg-[rgba(20,14,11,0.7)] py-5 backdrop-blur-xl lg:flex">
      <Logo />
      <nav className="mt-8 flex flex-1 flex-col items-center gap-2.5" aria-label="Principal">
        {NAVEGACION.map(({ a, texto, icono: Icono, exacto }) => (
          <NavLink
            key={a}
            to={a}
            end={exacto}
            title={texto}
            aria-label={texto}
            className={({ isActive }) =>
              cn(
                'inline-flex h-12 w-12 items-center justify-center rounded-2xl transition',
                isActive ? 'bg-primary-grad text-white shadow-primary' : 'text-muted hover:bg-surface-2 hover:text-text',
              )
            }
          >
            <Icono className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>
      <div className="flex flex-col items-center gap-2.5">
        <button
          type="button"
          title="Configuración"
          aria-label="Configuración"
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          onClick={onSalir}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-muted transition hover:bg-danger/15 hover:text-danger"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}

/* Barra superior: buscador en píldora, botones circulares y avatar del admin */
function Topbar({
  admin,
  hayNotificaciones,
  onRefrescar,
  onNotificaciones,
  onSalir,
}: Pick<AdminLayoutProps, 'admin' | 'hayNotificaciones' | 'onRefrescar' | 'onNotificaciones' | 'onSalir'>) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-bg/70 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 lg:py-4">
      <Logo className="h-10 w-10 rounded-xl lg:hidden" />
      <label className="relative hidden min-w-0 max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input type="search" placeholder="Buscar propiedades, clientes…" className="campo pl-11 pr-16" />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/[0.07] px-2 py-0.5 font-sans text-[11px] text-muted">
          ⌘K
        </kbd>
      </label>
      <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
        <IconButton icono={Search} etiqueta="Buscar" className="sm:hidden" />
        <IconButton icono={RefreshCw} etiqueta="Refrescar" onClick={onRefrescar} className="hidden sm:inline-flex" />
        <IconButton icono={Bell} etiqueta="Notificaciones" punto={hayNotificaciones} onClick={onNotificaciones} />
        <IconButton icono={Moon} etiqueta="Modo oscuro" className="hidden sm:inline-flex" />
        <div className="ml-1 flex items-center gap-3 rounded-full border border-border bg-surface-2/70 py-1 pl-1 pr-1 sm:pr-4">
          <Avatar nombre={admin.nombre} apellido={admin.apellido} tamano="sm" />
          <div className="hidden leading-tight sm:block">
            <p className="text-[13px] font-medium text-text">
              {admin.nombre} {admin.apellido}
            </p>
            <p className="text-[11px] text-muted">@{admin.usuario}</p>
          </div>
        </div>
        <IconButton icono={LogOut} etiqueta="Cerrar sesión" onClick={onSalir} className="lg:hidden" />
      </div>
    </header>
  );
}

/* Navegación inferior flotante en píldora de vidrio (móvil) */
function NavMovil() {
  return (
    <nav
      aria-label="Principal"
      className="glass fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full p-1.5 lg:hidden"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAVEGACION.map(({ a, texto, icono: Icono, exacto }) => (
        <NavLink
          key={a}
          to={a}
          end={exacto}
          aria-label={texto}
          className={({ isActive }) =>
            cn(
              'inline-flex h-12 w-12 items-center justify-center rounded-full transition',
              isActive ? 'bg-primary-grad text-white shadow-primary' : 'bg-white/[0.05] text-muted hover:text-text',
            )
          }
        >
          <Icono className="h-5 w-5" />
        </NavLink>
      ))}
    </nav>
  );
}

export interface AdminLayoutProps {
  admin: { nombre: string; apellido: string; usuario: string };
  hayNotificaciones?: boolean;
  onRefrescar?: () => void;
  onNotificaciones?: () => void;
  onSalir?: () => void;
}

export function AdminLayout(props: AdminLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar onSalir={props.onSalir} />
      <div className="lg:pl-[84px]">
        <Topbar {...props} />
        <main className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-2 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <NavMovil />
    </div>
  );
}

/** Encabezado estándar de cada pantalla del panel. */
export function EncabezadoPagina({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-text sm:text-[28px]">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-muted">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2.5">{acciones}</div>}
    </div>
  );
}
