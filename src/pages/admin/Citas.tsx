import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarX2, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { Avatar, Button, Card, EstadoVacio, IconButton, PildoraEstado, Segmentado, Skeleton, textoEstado } from '../../components/ui/basicos';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { exigir, mensajeError, useConsulta } from '../../lib/datos';
import { supabase } from '../../lib/supabase';
import type { Vista } from '../../lib/supabase';
import { cn, fechaCorta, fechaLarga, fechaLocal, horaCorta, hoyEcuador, lunesDe, numero, sumarDias } from '../../lib/utilidades';

type Cita = Vista<'v_cita_detalle'>;
const ESTADOS_CITA = ['agendada', 'realizada', 'cancelada', 'no_asistió'];
const HORAS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const COLOR_CITA: Record<string, string> = {
  agendada: 'border-primary/40 bg-primary/15 text-primary',
  realizada: 'border-success/40 bg-success/15 text-success',
  cancelada: 'border-danger/30 bg-danger/10 text-danger line-through',
  'no_asistió': 'border-danger/40 bg-danger/15 text-danger',
};

/** Estado del WhatsApp: confirmación y recordatorio. */
function EstadoWhatsApp({ cita }: { cita: Cita }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <MessageCircle className="h-3.5 w-3.5" />
        Confirmación
        {cita.estado_confirmacion ? <PildoraEstado estado={cita.estado_confirmacion} className="!px-2 !py-0.5 !text-[11px]" /> : <span>—</span>}
      </span>
      <span className="inline-flex items-center gap-1.5">
        Recordatorio
        {cita.estado_recordatorio ? <PildoraEstado estado={cita.estado_recordatorio} className="!px-2 !py-0.5 !text-[11px]" /> : <span className="text-muted/70">sin enviar</span>}
      </span>
    </div>
  );
}

export default function Citas() {
  const toast = useToast();
  const hoy = hoyEcuador();
  const [vista, setVista] = useState<'lista' | 'semana'>('lista');
  const [filtro, setFiltro] = useState('proximas');
  const [lunes, setLunes] = useState(lunesDe(hoy));
  const [abierta, setAbierta] = useState<number | null>(null);
  const [guardando, setGuardando] = useState<number | null>(null);

  const citas = useConsulta(async () => exigir(await supabase.from('v_cita_detalle').select('*').order('fecha', { ascending: false }).order('hora')), []);
  const todas = citas.datos ?? [];
  const seleccionada = todas.find((c) => c.cod_cita === abierta) ?? null;

  const cambiarEstado = async (cita: Cita, estado: string) => {
    if (cita.cod_cita == null || cita.estado_cita === estado) return;
    setGuardando(cita.cod_cita);
    const { error } = await supabase.from('cita').update({ estado_cita: estado }).eq('cod_cita', cita.cod_cita);
    setGuardando(null);
    if (error) toast.error('No se pudo cambiar el estado', mensajeError(error));
    else {
      toast.exito(`Cita marcada como "${textoEstado(estado)}"`, `${cita.nombre} ${cita.apellido}`);
      citas.recargar();
    }
  };

  const selectorEstado = (c: Cita) => (
    <select
      aria-label="Estado de la cita"
      disabled={guardando === c.cod_cita}
      className="h-9 rounded-full border border-border bg-surface px-3 text-xs text-text transition hover:bg-surface-3 focus:outline-none disabled:opacity-50"
      value={c.estado_cita ?? 'agendada'}
      onChange={(e) => cambiarEstado(c, e.target.value)}
      onClick={(e) => e.stopPropagation()}
    >
      {ESTADOS_CITA.map((s) => (
        <option key={s} value={s}>
          {textoEstado(s)}
        </option>
      ))}
    </select>
  );

  const filtradas = todas
    .filter((c) => {
      if (filtro === 'proximas') return (c.fecha ?? '') >= hoy && c.estado_cita === 'agendada';
      if (filtro === 'pasadas') return (c.fecha ?? '') < hoy;
      if (filtro === 'todas') return true;
      return c.estado_cita === filtro;
    })
    .sort((a, b) => {
      const ka = `${a.fecha} ${a.hora}`;
      const kb = `${b.fecha} ${b.hora}`;
      return filtro === 'proximas' ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });

  const diasSemana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const deLaSemana = todas.filter((c) => c.fecha && c.fecha >= diasSemana[0] && c.fecha <= diasSemana[6]);

  return (
    <>
      <EncabezadoPagina
        titulo="Citas"
        descripcion={citas.datos ? `${numero(todas.filter((c) => (c.fecha ?? '') >= hoy && c.estado_cita === 'agendada').length)} visitas próximas` : 'Visitas agendadas por los clientes'}
        acciones={
          <Segmentado
            valor={vista}
            onCambio={setVista}
            opciones={[
              { valor: 'lista', texto: 'Lista' },
              { valor: 'semana', texto: 'Semana' },
            ]}
          />
        }
      />

      {citas.error ? (
        <Card>
          <EstadoVacio icono={AlertCircle} titulo="No se pudieron cargar las citas" descripcion={citas.error} accion={<Button variante="secundario" onClick={citas.recargar}>Reintentar</Button>} />
        </Card>
      ) : vista === 'lista' ? (
        <Card
          titulo="Listado de citas"
          acciones={
            <Segmentado
              valor={filtro}
              onCambio={setFiltro}
              opciones={[
                { valor: 'proximas', texto: 'Próximas' },
                { valor: 'pasadas', texto: 'Pasadas' },
                { valor: 'cancelada', texto: 'Canceladas' },
                { valor: 'todas', texto: 'Todas' },
              ]}
            />
          }
        >
          {!citas.datos ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[76px]" />
              ))}
            </div>
          ) : filtradas.length === 0 ? (
            <EstadoVacio icono={CalendarX2} titulo="No hay citas en esta vista" descripcion="Cuando un cliente agende una visita aparecerá aquí al instante." />
          ) : (
            <div className="space-y-2.5">
              {filtradas.map((c) => (
                <div
                  key={c.cod_cita}
                  role="button"
                  tabIndex={0}
                  onClick={() => setAbierta(c.cod_cita)}
                  onKeyDown={(e) => e.key === 'Enter' && setAbierta(c.cod_cita)}
                  className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-surface-2/70 p-3 transition hover:bg-surface-3"
                >
                  <div className="flex min-w-[220px] flex-1 items-center gap-3">
                    <Avatar nombre={c.nombre ?? '?'} apellido={c.apellido ?? ''} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {c.nombre} {c.apellido}
                      </p>
                      <p className="truncate text-xs text-muted">{c.nombre_comercial}</p>
                    </div>
                  </div>
                  <div className="w-[120px] text-sm">
                    <p className="text-text">{c.fecha ? fechaCorta(c.fecha) : ''}</p>
                    <p className="text-xs text-muted">{c.hora ? horaCorta(c.hora) : ''}</p>
                  </div>
                  <div className="min-w-[230px] flex-1">
                    <EstadoWhatsApp cita={c} />
                  </div>
                  <div className="flex items-center gap-2">
                    <PildoraEstado estado={c.estado_cita ?? 'agendada'} />
                    {selectorEstado(c)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card
          titulo={`${fechaCorta(diasSemana[0])} – ${fechaCorta(diasSemana[6])}`}
          subtitulo={`${deLaSemana.length} ${deLaSemana.length === 1 ? 'cita' : 'citas'} en la semana`}
          acciones={
            <>
              <IconButton icono={ChevronLeft} etiqueta="Semana anterior" tamano="sm" onClick={() => setLunes(sumarDias(lunes, -7))} />
              <Button variante="secundario" tamano="sm" onClick={() => setLunes(lunesDe(hoy))}>
                Hoy
              </Button>
              <IconButton icono={ChevronRight} etiqueta="Semana siguiente" tamano="sm" onClick={() => setLunes(sumarDias(lunes, 7))} />
            </>
          }
        >
          {!citas.datos ? (
            <Skeleton className="h-[480px]" />
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[860px] gap-1.5" style={{ gridTemplateColumns: '3.25rem repeat(7, minmax(0, 1fr))' }}>
                <span />
                {diasSemana.map((d, i) => (
                  <div key={d} className={cn('rounded-2xl px-2 py-2 text-center', d === hoy ? 'bg-primary-grad text-white shadow-primary' : 'bg-surface-2/60 text-muted')}>
                    <p className="text-[11px]">{DIAS[i]}</p>
                    <p className={cn('text-lg font-light leading-tight', d !== hoy && 'text-text')}>{fechaLocal(d).getDate()}</p>
                  </div>
                ))}
                {HORAS.map((h) => (
                  <div key={h} className="contents">
                    <span className="pt-2 text-right text-[11px] text-muted">{String(h).padStart(2, '0')}:00</span>
                    {diasSemana.map((d) => {
                      const enCelda = deLaSemana.filter((c) => c.fecha === d && Number((c.hora ?? '').slice(0, 2)) === h);
                      return (
                        <div key={d} className="min-h-[58px] space-y-1 rounded-xl bg-surface-2/35 p-1">
                          {enCelda.map((c) => (
                            <button
                              key={c.cod_cita}
                              type="button"
                              onClick={() => setAbierta(c.cod_cita)}
                              title={`${c.nombre} ${c.apellido} · ${c.nombre_comercial}`}
                              className={cn('block w-full rounded-lg border px-2 py-1.5 text-left transition hover:brightness-125', COLOR_CITA[c.estado_cita ?? 'agendada'])}
                            >
                              <span className="block truncate text-xs font-medium">
                                {c.nombre} {c.apellido}
                              </span>
                              <span className="block truncate text-[11px] opacity-80">{c.nombre_comercial}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Detalle de la cita */}
      <Modal abierto={seleccionada !== null} onCerrar={() => setAbierta(null)} titulo="Detalle de la cita" ancho="sm">
        {seleccionada && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar nombre={seleccionada.nombre ?? '?'} apellido={seleccionada.apellido ?? ''} tamano="lg" />
              <div className="min-w-0">
                <Link to={`/admin/clientes/${seleccionada.cedula}`} className="block truncate text-base font-medium text-text hover:text-primary">
                  {seleccionada.nombre} {seleccionada.apellido}
                </Link>
                <p className="text-xs text-muted">
                  C.I. {seleccionada.cedula} · {seleccionada.telefono}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-surface-2/70 p-4">
              <p className="text-sm text-text">{seleccionada.nombre_comercial}</p>
              <p className="mt-1 text-[13px] capitalize text-muted">
                {seleccionada.fecha ? fechaLarga(seleccionada.fecha) : ''} · {seleccionada.hora ? horaCorta(seleccionada.hora) : ''}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-2/70 p-4">
              <p className="mb-2 text-[13px] text-muted">WhatsApp</p>
              <EstadoWhatsApp cita={seleccionada} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-muted">Estado de la cita</span>
              <div className="flex items-center gap-2">
                <PildoraEstado estado={seleccionada.estado_cita ?? 'agendada'} />
                {selectorEstado(seleccionada)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
