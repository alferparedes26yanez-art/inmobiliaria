import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// CARTO Dark Matter ahora exige API key, así que se usan los tiles estándar de OpenStreetMap
// (sin clave) oscurecidos con un filtro CSS: ver la clase .tiles-oscuros en index.css.
export const TILES_OSCUROS = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const CLASE_TILES = 'tiles-oscuros';
export const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Centro aproximado de Ecuador (sierra norte-centro) para cuando aún no hay punto. */
export const CENTRO_ECUADOR: [number, number] = [-0.6, -78.45];

const pinNaranja = L.divIcon({
  className: '',
  iconSize: [34, 44],
  iconAnchor: [17, 42],
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="pinSel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A2F"/><stop offset="1" stop-color="#F05A14"/></linearGradient></defs>
    <path d="M17 43C17 43 32 27.5 32 16.5A15 15 0 0 0 2 16.5C2 27.5 17 43 17 43Z" fill="url(#pinSel)" stroke="rgba(0,0,0,.35)"/>
    <circle cx="17" cy="16.5" r="6" fill="#0E0A08"/>
  </svg>`,
});

function Clics({ onElegir }: { onElegir: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onElegir(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recentrar({ posicion }: { posicion: [number, number] | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (posicion) mapa.setView(posicion, Math.max(mapa.getZoom(), 14), { animate: true });
  }, [posicion?.[0], posicion?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Mini-mapa: un clic fija la latitud y longitud de la propiedad. */
export function MapaSelector({
  latitud,
  longitud,
  onCambio,
}: {
  latitud: number | null;
  longitud: number | null;
  onCambio: (lat: number, lng: number) => void;
}) {
  const posicion: [number, number] | null = latitud != null && longitud != null ? [latitud, longitud] : null;
  return (
    <div className="h-72 overflow-hidden rounded-3xl border border-border">
      <MapContainer center={posicion ?? CENTRO_ECUADOR} zoom={posicion ? 15 : 7} className="h-full w-full" style={{ background: '#0E0A08' }}>
        <TileLayer url={TILES_OSCUROS} attribution={ATRIBUCION} className={CLASE_TILES} maxZoom={19} />
        <Clics onElegir={(lat, lng) => onCambio(Number(lat.toFixed(6)), Number(lng.toFixed(6)))} />
        <Recentrar posicion={posicion} />
        {posicion && <Marker position={posicion} icon={pinNaranja} />}
      </MapContainer>
    </div>
  );
}
