import { ArrowRight, MapPin, Megaphone, Tag } from 'lucide-react';
import { cn, fechaCorta, usd } from '../../lib/utilidades';
import { fotosOrdenadas } from './datos';
import type { OfertaPublica, PropiedadPublica } from './datos';

interface Props {
  ofertas: OfertaPublica[];
  propiedades: PropiedadPublica[];
  onVer: (p: PropiedadPublica) => void;
}

function ahorro(oferta: OfertaPublica, p: PropiedadPublica | undefined): number | null {
  if (!p || oferta.precio_oferta_usd == null || oferta.precio_oferta_usd >= p.precio_usd) return null;
  return Math.round((1 - oferta.precio_oferta_usd / p.precio_usd) * 100);
}

/** Tarjeta de oferta. `compacta` es la versión horizontal del carrusel móvil. */
function TarjetaOferta({ oferta, propiedad, onVer, compacta }: { oferta: OfertaPublica; propiedad?: PropiedadPublica; onVer: Props['onVer']; compacta?: boolean }) {
  const foto = propiedad ? fotosOrdenadas(propiedad)[0] : undefined;
  const pct = ahorro(oferta, propiedad);
  const Contenedor = propiedad ? 'button' : 'div';

  return (
    <Contenedor
      {...(propiedad ? { type: 'button' as const, onClick: () => onVer(propiedad) } : {})}
      className={cn(
        'group relative flex w-full overflow-hidden rounded-3xl border border-white/10 bg-surface-grad text-left transition',
        propiedad && 'hover:border-primary/50',
        compacta ? 'h-[132px] items-stretch' : 'flex-col',
      )}
    >
      <div className={cn('relative shrink-0 overflow-hidden bg-surface-2', compacta ? 'w-[118px]' : 'aspect-[16/9] w-full')}>
        {foto ? (
          <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-promo-grad text-white">
            <Megaphone className="h-7 w-7" />
          </span>
        )}
        {!compacta && (
          <>
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary-grad px-3 py-1 text-xs font-medium text-white shadow-primary">
              <Tag className="h-3 w-3" /> {oferta.etiqueta}
            </span>
            {pct != null && <span className="absolute right-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-[#0E2A1D] shadow-success">-{pct}%</span>}
          </>
        )}
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col', compacta ? 'justify-center px-3.5 py-3' : 'p-4')}>
        {compacta && (
          <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
            <Tag className="h-3 w-3" /> {oferta.etiqueta}
            {pct != null && <span className="ml-1 rounded-full bg-success/15 px-1.5 text-success">-{pct}%</span>}
          </span>
        )}
        <p className={cn('font-medium text-text', compacta ? 'line-clamp-2 text-sm leading-snug' : 'text-[17px] leading-snug')}>{oferta.titulo}</p>
        {!compacta && oferta.descripcion && <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">{oferta.descripcion}</p>}
        {propiedad && !compacta && (
          <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {propiedad.tipo_propiedad.nombre} · {propiedad.sector.nombre}, {propiedad.sector.ciudad}
          </p>
        )}
        {propiedad && (
          <div className={cn('flex items-baseline gap-2', compacta ? 'mt-1.5' : 'mt-3')}>
            <span className={cn('font-light text-text', compacta ? 'text-lg' : 'text-[28px] leading-none')}>{usd(oferta.precio_oferta_usd ?? propiedad.precio_usd)}</span>
            {oferta.precio_oferta_usd != null && <span className="text-xs text-muted line-through">{usd(propiedad.precio_usd)}</span>}
          </div>
        )}
        {!compacta && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-muted">{oferta.fecha_fin ? `Válida hasta el ${fechaCorta(oferta.fecha_fin)}` : 'Por tiempo limitado'}</span>
            {propiedad && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-grad px-4 py-2 text-[13px] font-medium text-white shadow-primary transition group-hover:brightness-110">
                Ver propiedad <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        )}
      </div>
    </Contenedor>
  );
}

/** Panel lateral de ofertas (escritorio). */
export function PanelOfertas({ ofertas, propiedades, onVer }: Props) {
  const porCodigo = new Map(propiedades.map((p) => [p.cod_propiedad, p]));
  return (
    <aside className="glass absolute bottom-5 right-5 top-5 z-[1000] hidden w-[380px] flex-col rounded-[28px] lg:flex">
      <div className="px-5 pb-3 pt-5">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Tag className="h-3.5 w-3.5" /> Ofertas especiales
        </p>
        <h2 className="mt-1.5 text-xl font-light leading-snug text-text">Aprovecha antes de que se vayan</h2>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-3">
        {ofertas.map((o) => (
          <TarjetaOferta key={o.cod_oferta} oferta={o} propiedad={o.cod_propiedad == null ? undefined : porCodigo.get(o.cod_propiedad)} onVer={onVer} />
        ))}
      </div>
    </aside>
  );
}

/** Carrusel horizontal de ofertas (móvil), encima de la navegación inferior. */
export function CarruselOfertas({ ofertas, propiedades, onVer }: Props) {
  const porCodigo = new Map(propiedades.map((p) => [p.cod_propiedad, p]));
  return (
    <div className="absolute inset-x-0 bottom-[92px] z-[1000] lg:hidden">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {ofertas.map((o) => (
          <div key={o.cod_oferta} className={cn('shrink-0 snap-center', ofertas.length === 1 ? 'w-full' : 'w-[85%]')}>
            <TarjetaOferta oferta={o} propiedad={o.cod_propiedad == null ? undefined : porCodigo.get(o.cod_propiedad)} onVer={onVer} compacta />
          </div>
        ))}
      </div>
    </div>
  );
}
