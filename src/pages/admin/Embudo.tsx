import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Building2, GripVertical, Loader2, Repeat2 } from 'lucide-react';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { Avatar, Button, Card, EstadoVacio, Skeleton, textoEstado } from '../../components/ui/basicos';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { exigir, mensajeError, useConsulta } from '../../lib/datos';
import { supabase } from '../../lib/supabase';
import { cn, haceCuanto, numero, usd } from '../../lib/utilidades';

const ETAPAS = [
  { clave: 'interesado', color: '#A3948A' },
  { clave: 'cita_agendada', color: '#FF7A2F' },
  { clave: 'visitó', color: '#FFB078' },
  { clave: 'anticipo', color: '#F5C451' },
  { clave: 'vendido', color: '#5EE6A8' },
  { clave: 'descartado', color: '#F87171' },
];

async function cargarIntereses() {
  return exigir(
    await supabase
      .from('interes')
      .select('*, cliente(nombre, apellido, telefono), propiedad(nombre_comercial, precio_usd)')
      .order('fecha_actualizacion', { ascending: false }),
  );
}
type Interes = Awaited<ReturnType<typeof cargarIntereses>>[number];

export default function Embudo() {
  const toast = useToast();
  const lista = useConsulta(cargarIntereses, []);
  const [arrastrado, setArrastrado] = useState<Interes | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [moviendo, setMoviendo] = useState<number | null>(null);
  const [anticipo, setAnticipo] = useState<{ interes: Interes; monto: string } | null>(null);
  const [ofrecer, setOfrecer] = useState<Interes | null>(null);

  const disponibles = useConsulta(
    async () =>
      ofrecer
        ? exigir(await supabase.from('propiedad').select('cod_propiedad, nombre_comercial, precio_usd, sector(nombre, ciudad)').eq('estado', 'disponible').order('nombre_comercial'))
        : [],
    [ofrecer?.cod_interes],
  );

  const aplicar = async (interes: Interes, etapa: string, monto?: number) => {
    setMoviendo(interes.cod_interes);
    const { error } = await supabase
      .from('interes')
      .update(monto === undefined ? { etapa } : { etapa, monto_anticipo_usd: monto })
      .eq('cod_interes', interes.cod_interes);
    setMoviendo(null);
    if (error) {
      toast.error('No se pudo mover la tarjeta', mensajeError(error));
      return false;
    }
    toast.exito(`${interes.cliente.nombre} ${interes.cliente.apellido} pasó a "${textoEstado(etapa)}"`, interes.propiedad.nombre_comercial);
    lista.recargar();
    return true;
  };

  const mover = (interes: Interes, etapa: string) => {
    if (interes.etapa === etapa) return;
    // Al pasar a "anticipo" se pide el monto antes de guardar.
    if (etapa === 'anticipo') setAnticipo({ interes, monto: interes.monto_anticipo_usd == null ? '' : String(interes.monto_anticipo_usd) });
    else void aplicar(interes, etapa);
  };

  const confirmarAnticipo = async () => {
    if (!anticipo) return;
    const monto = Number(anticipo.monto.replace(',', '.'));
    if (anticipo.monto.trim() === '' || !Number.isFinite(monto) || monto < 0) {
      toast.error('Monto inválido', 'Escribe el anticipo en dólares, mayor o igual a 0.');
      return;
    }
    if (await aplicar(anticipo.interes, 'anticipo', monto)) setAnticipo(null);
  };

  const ofrecerPropiedad = async (codPropiedad: number, nombre: string) => {
    if (!ofrecer) return;
    const { error } = await supabase.from('interes').insert({ cedula: ofrecer.cedula, cod_propiedad: codPropiedad, etapa: 'interesado' });
    if (error) {
      toast.error('No se pudo registrar el interés', error.code === '23505' ? 'Este cliente ya tiene un interés registrado en esa propiedad.' : mensajeError(error));
      return;
    }
    toast.exito('Nueva propiedad ofrecida', `${ofrecer.cliente.nombre} ${ofrecer.cliente.apellido} · ${nombre}`);
    setOfrecer(null);
    lista.recargar();
  };

  if (lista.error) {
    return (
      <>
        <EncabezadoPagina titulo="Embudo de ventas" />
        <Card>
          <EstadoVacio icono={AlertCircle} titulo="No se pudo cargar el embudo" descripcion={lista.error} accion={<Button variante="secundario" onClick={lista.recargar}>Reintentar</Button>} />
        </Card>
      </>
    );
  }

  const yaTiene = new Set((lista.datos ?? []).filter((i) => i.cedula === ofrecer?.cedula).map((i) => i.cod_propiedad));

  return (
    <>
      <EncabezadoPagina
        titulo="Embudo de ventas"
        descripcion={lista.datos ? `${numero(lista.datos.length)} intereses · arrastra las tarjetas entre etapas` : 'Seguimiento de cada cliente por etapa'}
      />

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-max gap-4">
          {ETAPAS.map(({ clave, color }) => {
            const tarjetas = (lista.datos ?? []).filter((i) => i.etapa === clave);
            return (
              <section
                key={clave}
                onDragOver={(e) => {
                  if (!arrastrado) return;
                  e.preventDefault();
                  setSobre(clave);
                }}
                onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setSobre(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setSobre(null);
                  if (arrastrado) mover(arrastrado, clave);
                  setArrastrado(null);
                }}
                className={cn(
                  'card flex w-[290px] shrink-0 flex-col p-3 transition',
                  sobre === clave && arrastrado?.etapa !== clave && 'border-primary/60 bg-primary/[0.06]',
                )}
              >
                <header className="flex items-center justify-between px-2 pb-3 pt-1.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-text">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    {textoEstado(clave)}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{lista.datos ? tarjetas.length : '·'}</span>
                </header>

                <div className="flex min-h-[120px] flex-1 flex-col gap-2.5">
                  {!lista.datos ? (
                    <>
                      <Skeleton className="h-[118px]" />
                      <Skeleton className="h-[118px]" />
                    </>
                  ) : tarjetas.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-muted">
                      Suelta una tarjeta aquí
                    </p>
                  ) : (
                    tarjetas.map((i) => (
                      <article
                        key={i.cod_interes}
                        draggable={moviendo === null}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          setArrastrado(i);
                        }}
                        onDragEnd={() => {
                          setArrastrado(null);
                          setSobre(null);
                        }}
                        className={cn(
                          'relative cursor-grab rounded-2xl border border-border bg-surface-2/80 p-3.5 transition hover:bg-surface-3 active:cursor-grabbing',
                          arrastrado?.cod_interes === i.cod_interes && 'opacity-40',
                        )}
                      >
                        {moviendo === i.cod_interes && (
                          <span className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50">
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                          </span>
                        )}
                        <div className="flex items-center gap-2.5">
                          <Avatar nombre={i.cliente.nombre} apellido={i.cliente.apellido} tamano="sm" />
                          <Link to={`/admin/clientes/${i.cedula}`} className="min-w-0 flex-1 truncate text-sm font-medium text-text hover:text-primary" draggable={false}>
                            {i.cliente.nombre} {i.cliente.apellido}
                          </Link>
                          <GripVertical className="h-4 w-4 shrink-0 text-muted/60" />
                        </div>
                        <p className="mt-2.5 flex items-center gap-1.5 truncate text-xs text-muted" title={i.propiedad.nombre_comercial}>
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {i.propiedad.nombre_comercial}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                          <span className="text-text">{usd(i.propiedad.precio_usd)}</span>
                          <span className="text-muted">{haceCuanto(i.fecha_actualizacion)}</span>
                        </div>
                        {i.monto_anticipo_usd != null && (clave === 'anticipo' || clave === 'vendido') && (
                          <p className="mt-2 rounded-full bg-success/10 px-3 py-1 text-center text-xs text-success">Anticipo {usd(i.monto_anticipo_usd, true)}</p>
                        )}
                        {/* Alternativa al arrastre (táctil y teclado) */}
                        <select
                          aria-label="Mover a otra etapa"
                          className="mt-2.5 h-8 w-full rounded-full border border-border bg-surface px-3 text-xs text-muted transition hover:text-text focus:outline-none"
                          value={i.etapa}
                          onChange={(e) => mover(i, e.target.value)}
                        >
                          {ETAPAS.map((x) => (
                            <option key={x.clave} value={x.clave}>
                              {x.clave === i.etapa ? `En: ${textoEstado(x.clave)}` : `Mover a: ${textoEstado(x.clave)}`}
                            </option>
                          ))}
                        </select>
                        {clave === 'descartado' && (
                          <Button variante="secundario" tamano="sm" icono={Repeat2} className="mt-2 w-full" onClick={() => setOfrecer(i)}>
                            Ofrecer otra propiedad
                          </Button>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Monto del anticipo */}
      <Modal
        abierto={anticipo !== null}
        onCerrar={() => moviendo === null && setAnticipo(null)}
        titulo="Registrar anticipo"
        ancho="sm"
        pie={
          <>
            <Button variante="secundario" onClick={() => setAnticipo(null)} disabled={moviendo !== null}>
              Cancelar
            </Button>
            <Button onClick={confirmarAnticipo} cargando={moviendo !== null}>
              Guardar anticipo
            </Button>
          </>
        }
      >
        {anticipo && (
          <>
            <p className="text-sm text-muted">
              <span className="text-text">
                {anticipo.interes.cliente.nombre} {anticipo.interes.cliente.apellido}
              </span>{' '}
              deja un anticipo por <span className="text-text">{anticipo.interes.propiedad.nombre_comercial}</span> ({usd(anticipo.interes.propiedad.precio_usd)}). La propiedad pasará a
              "reservada".
            </p>
            <label className="mt-4 block">
              <span className="etiqueta">Monto del anticipo (USD)</span>
              <input
                autoFocus
                className="campo"
                inputMode="decimal"
                placeholder="5000"
                value={anticipo.monto}
                onChange={(e) => setAnticipo({ ...anticipo, monto: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && confirmarAnticipo()}
              />
            </label>
          </>
        )}
      </Modal>

      {/* Ofrecer otra propiedad a un cliente descartado */}
      <Modal abierto={ofrecer !== null} onCerrar={() => setOfrecer(null)} titulo="Ofrecer otra propiedad" ancho="md">
        {ofrecer && (
          <>
            <p className="mb-4 text-sm text-muted">
              Elige una propiedad disponible para{' '}
              <span className="text-text">
                {ofrecer.cliente.nombre} {ofrecer.cliente.apellido}
              </span>
              . Se creará un nuevo interés en etapa "interesado".
            </p>
            {disponibles.error ? (
              <p className="text-[13px] text-danger">{disponibles.error}</p>
            ) : disponibles.cargando || !disponibles.datos ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : disponibles.datos.filter((p) => !yaTiene.has(p.cod_propiedad)).length === 0 ? (
              <EstadoVacio icono={Building2} titulo="No hay otras propiedades disponibles" descripcion="Este cliente ya tiene interés en todas las propiedades disponibles." />
            ) : (
              <div className="space-y-2">
                {disponibles.datos
                  .filter((p) => !yaTiene.has(p.cod_propiedad))
                  .map((p) => (
                    <button
                      key={p.cod_propiedad}
                      type="button"
                      onClick={() => ofrecerPropiedad(p.cod_propiedad, p.nombre_comercial)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface-2/70 px-4 py-3 text-left transition hover:bg-surface-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-text">{p.nombre_comercial}</span>
                        <span className="block truncate text-xs text-muted">
                          {p.sector.nombre}, {p.sector.ciudad}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-text">{usd(p.precio_usd)}</span>
                    </button>
                  ))}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
