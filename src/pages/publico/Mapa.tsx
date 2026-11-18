import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, List, Map as MapaIcono, MapPinOff, Search, UserCog, X } from 'lucide-react';
import { Logo } from '../../components/layout/AdminLayout';
import { ATRIBUCION, CENTRO_ECUADOR, CLASE_TILES, TILES_OSCUROS } from '../../components/MapaSelector';
import { Button, EstadoVacio, Skeleton } from '../../components/ui/basicos';
import { useConsulta } from '../../lib/datos';
import { cn, usd } from '../../lib/utilidades';
import { RANGOS_PRECIO, cargarPropiedadesPublicas, fotosOrdenadas } from './datos';
import type { PropiedadPublica } from './datos';
import { FichaPropiedad } from './FichaPropiedad';

/** Marcador: foto principal recortada en círculo dentro de un pin naranja. */
function iconoPropiedad(foto: string | null, activo: boolean): L.DivIcon {
  const imagen = foto
    ? `<span class="pin-foto__img" style="background-image:url('${encodeURI(foto).replace(/'/g, '%27')}')"></span>`
    : `<span class="pin-foto__img pin-foto__img--vacio"></span>`;
  return L.divIcon({
    className: '',
    iconSize: [56, 68],
    iconAnchor: [28, 66],
    html: `<span class="pin-foto${activo ? ' pin-foto--activo' : ''}">${imagen}</span>`,
  });
}

/** Ajusta el encuadre para que se vean todas las propiedades filtradas. */
function Encuadre({ puntos }: { puntos: Array<[number, number]> }) {
  const mapa = useMap();
  const clave = puntos.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (puntos.length === 0) return;
    if (puntos.length === 1) mapa.setView(puntos[0], 14, { animate: true });
    else mapa.fitBounds(L.latLngBounds(puntos), { paddingTopLeft: [40, 150], paddingBottomRight: [40, 110], maxZoom: 14 });
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function Mapa() {
  const propiedades = useConsulta(cargarPropiedadesPublicas, []);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [rango, setRango] = useState('');
  const [seleccionada, setSeleccionada] = useState<PropiedadPublica | null>(null);
  const [lista, setLista] = useState(false);

  const todas = propiedades.datos ?? [];
  const tipos = useMemo(() => [...new Set(todas.map((p) => p.tipo_propiedad.nombre))].sort(), [todas]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const r = RANGOS_PRECIO.find((x) => x.clave === rango) ?? RANGOS_PRECIO[0];
    return todas.filter(
      (p) =>
        (!texto || `${p.nombre_comercial} ${p.sector.nombre} ${p.sector.ciudad} ${p.direccion}`.toLowerCase().includes(texto)) &&
        (!tipo || p.tipo_propiedad.nombre === tipo) &&
        p.precio_usd >= r.min &&
        p.precio_usd <= r.max,
    );
  }, [todas, busqueda, tipo, rango]);

  const puntos = useMemo(() => filtradas.map((p) => [p.latitud, p.longitud] as [number, number]), [filtradas]);
  const hayFiltros = Boolean(busqueda || tipo || rango);

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg">
      <MapContainer center={CENTRO_ECUADOR} zoom={7} zoomControl={false} className="h-full w-full" style={{ background: '#0E0A08' }}>
        <TileLayer url={TILES_OSCUROS} attribution={ATRIBUCION} className={CLASE_TILES} maxZoom={19} />
        <Encuadre puntos={puntos} />
        {filtradas.map((p) => (
          <Marker
            key={p.cod_propiedad}
            position={[p.latitud, p.longitud]}
            icon={iconoPropiedad(fotosOrdenadas(p)[0] ?? null, seleccionada?.cod_propiedad === p.cod_propiedad)}
            title={`${p.nombre_comercial} · ${usd(p.precio_usd)}`}
            alt={p.nombre_comercial}
            eventHandlers={{ click: () => setSeleccionada(p) }}
          />
        ))}
      </MapContainer>

      {/* Barra superior flotante en píldora */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center p-3 sm:p-5">
        <div className="glass pointer-events-auto flex w-full max-w-4xl flex-col gap-2 rounded-[28px] p-2 sm:flex-row sm:items-center sm:rounded-full">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Logo className="h-10 w-10 shrink-0 rounded-full" />
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="campo h-10 border-transparent bg-white/[0.06] pl-11"
                placeholder="Buscar por nombre, sector o ciudad"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <select aria-label="Tipo de propiedad" className="campo h-10 min-w-0 flex-1 border-transparent bg-white/[0.06] sm:w-40 sm:flex-none" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {tipos.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select aria-label="Rango de precio" className="campo h-10 min-w-0 flex-1 border-transparent bg-white/[0.06] sm:w-48 sm:flex-none" value={rango} onChange={(e) => setRango(e.target.value)}>
              {RANGOS_PRECIO.map((r) => (
                <option key={r.clave} value={r.clave}>
                  {r.texto}
                </option>
              ))}
            </select>
            <Link
              to="/admin"
              title="Acceso administradores"
              aria-label="Acceso administradores"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-muted transition hover:bg-surface-3 hover:text-text lg:inline-flex"
            >
              <UserCog className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Contador / estados */}
      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[1000] flex justify-center px-4 lg:bottom-6">
        {propiedades.error ? (
          <div className="glass pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-4 pr-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {propiedades.error}
            <Button variante="secundario" tamano="sm" onClick={propiedades.recargar}>
              Reintentar
            </Button>
          </div>
        ) : !propiedades.datos ? (
          <div className="glass flex items-center gap-3 rounded-full px-4 py-2.5">
            <Skeleton className="h-3 w-40 rounded-full" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="glass pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-4 pr-2 text-sm text-text">
            <MapPinOff className="h-4 w-4 shrink-0 text-muted" />
            {hayFiltros ? 'Ninguna propiedad coincide con tu búsqueda' : 'Aún no hay propiedades disponibles'}
            {hayFiltros && (
              <Button
                variante="secundario"
                tamano="sm"
                onClick={() => {
                  setBusqueda('');
                  setTipo('');
                  setRango('');
                }}
              >
                Quitar filtros
              </Button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setLista(true)} className="glass pointer-events-auto hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm text-text transition hover:bg-surface-3 lg:flex">
            <List className="h-4 w-4 text-primary" />
            {filtradas.length} {filtradas.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'} · ver lista
          </button>
        )}
      </div>

      {/* Nav inferior flotante (móvil) */}
      <nav aria-label="Principal" className="glass absolute bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1.5 rounded-full p-1.5 lg:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        <button type="button" aria-label="Mapa" onClick={() => setLista(false)} className={cn('inline-flex h-12 w-12 items-center justify-center rounded-full transition', !lista ? 'bg-primary-grad text-white shadow-primary' : 'bg-white/[0.05] text-muted')}>
          <MapaIcono className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Lista de propiedades" onClick={() => setLista(true)} className={cn('inline-flex h-12 w-12 items-center justify-center rounded-full transition', lista ? 'bg-primary-grad text-white shadow-primary' : 'bg-white/[0.05] text-muted')}>
          <List className="h-5 w-5" />
        </button>
        <Link to="/admin" aria-label="Acceso administradores" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-muted transition hover:text-text">
          <UserCog className="h-5 w-5" />
        </Link>
      </nav>

      {/* Lista de propiedades: panel lateral en escritorio, hoja inferior en móvil */}
      {lista && (
        <aside className="glass absolute inset-x-0 bottom-0 z-[1001] flex max-h-[75dvh] animate-sheet-up flex-col rounded-t-[28px] pb-24 lg:inset-x-auto lg:bottom-5 lg:right-5 lg:top-24 lg:max-h-none lg:w-[380px] lg:animate-fade-up lg:rounded-3xl lg:pb-0">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h2 className="text-base font-medium text-text">
              {filtradas.length} {filtradas.length === 1 ? 'propiedad' : 'propiedades'}
            </h2>
            <button type="button" aria-label="Cerrar lista" onClick={() => setLista(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:text-text">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
            {filtradas.length === 0 ? (
              <EstadoVacio icono={MapPinOff} titulo="Sin resultados" descripcion="Prueba con otros filtros." />
            ) : (
              filtradas.map((p) => {
                const foto = fotosOrdenadas(p)[0];
                return (
                  <button
                    key={p.cod_propiedad}
                    type="button"
                    onClick={() => setSeleccionada(p)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-surface-2/70 p-2.5 text-left transition hover:bg-surface-3"
                  >
                    {foto ? <img src={foto} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-xl object-cover" /> : <span className="h-16 w-20 shrink-0 rounded-xl bg-surface" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{p.nombre_comercial}</span>
                      <span className="block truncate text-xs text-muted">
                        {p.tipo_propiedad.nombre} · {p.sector.nombre}, {p.sector.ciudad}
                      </span>
                      <span className="mt-1 block text-[15px] font-light text-text">{usd(p.precio_usd)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      <FichaPropiedad propiedad={seleccionada} onCerrar={() => setSeleccionada(null)} />
    </div>
  );
}
