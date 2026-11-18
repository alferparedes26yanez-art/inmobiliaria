import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';

/**
 * Zona que cubre el mapa público. Para cambiar de provincia (o ampliar a varias)
 * basta con editar estos valores.
 * Límites aproximados de la provincia de Tungurahua, con un pequeño margen.
 */
export const REGION = {
  nombre: 'Tungurahua',
  sur: -1.62,
  oeste: -78.98,
  norte: -0.88,
  este: -78.05,
  centro: [-1.25, -78.55] as LatLngTuple,
};

export const LIMITES_REGION: LatLngBoundsExpression = [
  [REGION.sur, REGION.oeste],
  [REGION.norte, REGION.este],
];

export function dentroDeRegion(latitud: number, longitud: number): boolean {
  return latitud >= REGION.sur && latitud <= REGION.norte && longitud >= REGION.oeste && longitud <= REGION.este;
}
