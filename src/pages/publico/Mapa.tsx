import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, List, Map as MapaIcono, MapPinOff, Search, SlidersHorizontal, X } from 'lucide-react';
import { ATRIBUCION, CENTRO_ECUADOR, CLASE_TILES, TILES_OSCUROS } from '../../components/MapaSelector';
import { Button, EstadoVacio, Skeleton } from '../../components/ui/basicos';
import { useConsulta } from '../../lib/datos';
import { cn, usd } from '../../lib/utilidades';
import { RANGOS_PRECIO, cargarOfertasPublicas, cargarPropiedadesPublicas, fotosOrdenadas } from './datos';
import type { OfertaPublica, PropiedadPublica } from './datos';
import { FichaPropiedad } from './FichaPropiedad';
import { CarruselOfertas, PanelOfertas } from './PanelOfertas';

/** Marcador: foto principal recortada en círculo dentro de un pin naranja (con distintivo si tiene oferta). */
function iconoPropiedad(foto: string | null, activo: boolean, oferta: boolean): L.DivIcon {
  const imagen = foto
    ? `<span class="pin-foto__img" style="background-image:url('${encodeURI(foto).replace(/'/g, '%27')}')"></span>`
    : `<span class="pin-foto__img pin-foto__img--vacio"></span>`;
  return L.divIcon({
    className: '',
    iconSize: [56, 68],
    iconAnchor: [28, 66],
    html: `<span class="pin-wrap"><span class="pin-foto${activo ? ' pin-foto--activo' : ''}">${imagen}</span>${oferta ? '<span class="pin-oferta">%</span>' : ''}</span>`,
  });
}

const esEscritorio = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

/** Ajusta el encuadre para que se vean todas las propiedades filtradas, dejando libre el espacio de los paneles. */
function Encuadre({ puntos, hayOfertas }: { puntos: Array<[number, number]>; hayOfertas: boolean }) {
  const mapa = useMap();
  const clave = puntos.map((p) => p.join(',')).join('|') + String(hayOfertas);
  useEffect(() => {
    if (puntos.length === 0) return;
    const escritorio = esEscritorio();
    const derecha = escritorio && hayOfertas ? 440 : 40;
    const abajo = !escritorio && hayOfertas ? 260 : 120;
    if (puntos.length === 1) mapa.setView(puntos[0], 14, { animate: true });
    else mapa.fitBounds(L.latLngBounds(puntos), { paddingTopLeft: [40, 120], paddingBottomRight: [derecha, abajo], maxZoom: 14 });
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Centra el mapa en la propiedad elegida desde una oferta. */
function Enfocar({ destino }: { destino: [number, number] | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (destino) mapa.flyTo(destino, Math.max(mapa.getZoom(), 14), { duration: 0.8 });
  }, [destino]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function Mapa() {
  const propiedades = useConsulta(cargarPropiedadesPublicas, []);
  const ofertasConsulta = useConsulta(cargarOfertasPublicas, []);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [rango, setRango] = useState('');
  const [seleccionada, setSeleccionada] = useState<PropiedadPublica | null>(null);
  const [destino, setDestino] = useState<[number, number] | null>(null);
  const [lista, setLista] = useState(false);
  const [filtrosMovil, setFiltrosMovil] = useState(false);

  const todas = propiedades.datos ?? [];
  const tipos = useMemo(() => [...new Set(todas.map((p) => p.tipo_propiedad.nombre))].sort(), [todas]);

  // Solo se muestran las ofertas cuya propiedad (si tiene) está cargada en el mapa.
  const ofertas = useMemo(() => {
    const visibles = new Set(todas.map((p) => p.cod_propiedad));
    return (ofertasConsulta.datos ?? []).filter((o) => o.cod_propiedad == null || visibles.has(o.cod_propiedad));
  }, [ofertasConsulta.datos, todas]);
  const ofertaPorPropiedad = useMemo(() => {
    const m = new Map<number, OfertaPublica>();
    for (const o of ofertas) if (o.cod_propiedad != null && !m.has(o.cod_propiedad)) m.set(o.cod_propiedad, o);
    return m;
  }, [ofertas]);
  const hayOfertas = ofertas.length > 0;

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const r = RANGOS_PRECIO.find((x) => x.clave === rango) ?? RANGOS_PRECIO[0];
    return todas.filter((p) => {
      const precio = ofertaPorPropiedad.get(p.cod_propiedad)?.precio_oferta_usd ?? p.precio_usd;
      return (
        (!texto || `${p.nombre_comercial} ${p.sector.nombre} ${p.sector.ciudad} ${p.direccion}`.toLowerCase().includes(texto)) &&
        (!tipo || p.tipo_propiedad.nombre === tipo) &&
        precio >= r.min &&
        precio <= r.max
      );
    });
  }, [todas, busqueda, tipo, rango, ofertaPorPropiedad]);

  const puntos = useMemo(() => filtradas.map((p) => [p.latitud, p.longitud] as [number, number]), [filtradas]);
  const hayFiltros = Boolean(busqueda || tipo || rango);
  const quitarFiltros = () => {
    setBusqueda('');
    setTipo('');
    setRango('');
  };
  const verDesdeOferta = (p: PropiedadPublica) => {
    setDestino([p.latitud, p.longitud]);
    setSeleccionada(p);
  };

  const selectorTipo = (
    <select aria-label="Tipo de propiedad" className="campo h-11 border-transparent bg-white/[0.06]" value={tipo} onChange={(e) => setTipo(e.target.value)}>
      <option value="">Todos los tipos</option>
      {tipos.map((t) => (
        <option key={t}>{t}</option>
      ))}
    </select>
  );
  const selectorPrecio = (
    <select aria-label="Rango de precio" className="campo h-11 border-transparent bg-white/[0.06]" value={rango} onChange={(e) => setRango(e.target.value)}>
      {RANGOS_PRECIO.map((r) => (
        <option key={r.clave} value={r.clave}>
          {r.texto}
        </option>
      ))}
    </select>
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg">
      <MapContainer center={CENTRO_ECUADOR} zoom={7} zoomControl={false} className="h-full w-full" style={{ background: '#0E0A08' }}>
        <TileLayer url={TILES_OSCUROS} attribution={ATRIBUCION} className={CLASE_TILES} maxZoom={19} />
        <Encuadre puntos={puntos} hayOfertas={hayOfertas} />
        <Enfocar destino={destino} />
        {filtradas.map((p) => (
          <Marker
            key={p.cod_propiedad}
            position={[p.latitud, p.longitud]}
            icon={iconoPropiedad(fotosOrdenadas(p)[0] ?? null, seleccionada?.cod_propiedad === p.cod_propiedad, ofertaPorPropiedad.has(p.cod_propiedad))}
            title={`${p.nombre_comercial} · ${usd(ofertaPorPropiedad.get(p.cod_propiedad)?.precio_oferta_usd ?? p.precio_usd)}`}
            alt={p.nombre_comercial}
            eventHandlers={{ click: () => setSeleccionada(p) }}
          />
        ))}
      </MapContainer>

      {/* Búsqueda y filtros sobre el área del mapa (a la izquierda del panel de ofertas) */}
      <header className={cn('pointer-events-none absolute left-0 top-0 z-[1000] p-3 sm:p-5', hayOfertas ? 'right-0 lg:right-[400px]' : 'right-0')}>
        <div className="mx-auto w-full max-w-3xl">
          <div className="glass pointer-events-auto flex items-center gap-2 rounded-full p-1.5">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="campo h-11 border-transparent bg-white/[0.06] pl-11" placeholder="Buscar por nombre, sector o ciudad" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </label>
            <div className="hidden w-44 shrink-0 sm:block">{selectorTipo}</div>
            <div className="hidden w-48 shrink-0 sm:block">{selectorPrecio}</div>
            <button
              type="button"
              aria-label="Filtros"
              aria-expanded={filtrosMovil}
              onClick={() => setFiltrosMovil((v) => !v)}
              className={cn(
                'relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition sm:hidden',
                filtrosMovil ? 'bg-primary-grad text-white' : 'bg-white/[0.06] text-muted',
              )}
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
              {(tipo || rango) && !filtrosMovil && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}
            </button>
          </div>
          {filtrosMovil && (
            <div className="glass pointer-events-auto mt-2 grid animate-fade-up grid-cols-2 gap-2 rounded-3xl p-2 sm:hidden">
              {selectorTipo}
              {selectorPrecio}
            </div>
          )}
        </div>
      </header>

      {/* Panel de ofertas especiales */}
      {hayOfertas && (
        <>
          <PanelOfertas ofertas={ofertas} propiedades={todas} onVer={verDesdeOferta} />
          {!lista && <CarruselOfertas ofertas={ofertas} propiedades={todas} onVer={verDesdeOferta} />}
        </>
      )}

      {/* Contador / estados, centrado en el área del mapa */}
      <div className={cn('pointer-events-none absolute bottom-6 left-0 z-[1000] hidden justify-center px-4 lg:flex', hayOfertas ? 'right-[400px]' : 'right-0')}>
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
              <Button variante="secundario" tamano="sm" onClick={quitarFiltros}>
                Quitar filtros
              </Button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setLista(true)} className="glass pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-text transition hover:bg-surface-3">
            <List className="h-4 w-4 text-primary" />
            {filtradas.length} {filtradas.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'} · ver lista
          </button>
        )}
      </div>

      {/* Nav inferior flotante (móvil) */}
      <nav aria-label="Principal" className="glass absolute bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1.5 rounded-full p-1.5 lg:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        <button type="button" aria-label="Mapa" onClick={() => setLista(false)} className={cn('inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm transition', !lista ? 'bg-primary-grad text-white shadow-primary' : 'bg-white/[0.05] text-muted')}>
          <MapaIcono className="h-5 w-5" /> Mapa
        </button>
        <button type="button" aria-label="Lista de propiedades" onClick={() => setLista(true)} className={cn('inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm transition', lista ? 'bg-primary-grad text-white shadow-primary' : 'bg-white/[0.05] text-muted')}>
          <List className="h-5 w-5" /> Lista
          {propiedades.datos && <span className={cn('rounded-full px-1.5 text-xs', lista ? 'bg-white/20' : 'bg-white/10')}>{filtradas.length}</span>}
        </button>
      </nav>

      {/* Lista de propiedades: panel a la izquierda en escritorio, hoja inferior en móvil */}
      {lista && (
        <aside className="glass absolute inset-x-0 bottom-0 z-[1001] flex max-h-[75dvh] animate-sheet-up flex-col rounded-t-[28px] pb-24 lg:bottom-5 lg:left-5 lg:right-auto lg:top-24 lg:max-h-none lg:w-[380px] lg:animate-fade-up lg:rounded-3xl lg:pb-0">
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
              <EstadoVacio
                icono={MapPinOff}
                titulo="Sin resultados"
                descripcion="Prueba con otros filtros."
                accion={hayFiltros ? <Button variante="secundario" tamano="sm" onClick={quitarFiltros}>Quitar filtros</Button> : undefined}
              />
            ) : (
              filtradas.map((p) => {
                const foto = fotosOrdenadas(p)[0];
                const oferta = ofertaPorPropiedad.get(p.cod_propiedad);
                return (
                  <button key={p.cod_propiedad} type="button" onClick={() => verDesdeOferta(p)} className="flex w-full items-center gap-3 rounded-2xl bg-surface-2/70 p-2.5 text-left transition hover:bg-surface-3">
                    {foto ? <img src={foto} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-xl object-cover" /> : <span className="h-16 w-20 shrink-0 rounded-xl bg-surface" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{p.nombre_comercial}</span>
                      <span className="block truncate text-xs text-muted">
                        {p.tipo_propiedad.nombre} · {p.sector.nombre}, {p.sector.ciudad}
                      </span>
                      <span className="mt-1 flex items-baseline gap-2">
                        <span className="text-[15px] font-light text-text">{usd(oferta?.precio_oferta_usd ?? p.precio_usd)}</span>
                        {oferta?.precio_oferta_usd != null && <span className="text-xs text-muted line-through">{usd(p.precio_usd)}</span>}
                        {oferta && <span className="rounded-full bg-primary/15 px-2 text-[11px] font-medium text-primary">{oferta.etiqueta}</span>}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      <FichaPropiedad
        propiedad={seleccionada}
        oferta={seleccionada ? ofertaPorPropiedad.get(seleccionada.cod_propiedad) ?? null : null}
        onCerrar={() => setSeleccionada(null)}
      />
    </div>
  );
}
