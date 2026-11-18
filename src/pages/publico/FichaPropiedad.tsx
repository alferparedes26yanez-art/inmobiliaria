import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, Droplets, ImageOff, MapPin, Ruler, Sparkles, Waves, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, PildoraEstado, Skeleton } from '../../components/ui/basicos';
import { Modal } from '../../components/ui/Modal';
import { exigir, mensajeError, useConsulta } from '../../lib/datos';
import { supabase } from '../../lib/supabase';
import { cn, fechaLarga, hoyEcuador, numero, sumarDias, usd } from '../../lib/utilidades';
import { HORARIOS, esquemaReserva, fotosOrdenadas, horaActualEcuador, nivelAcabados } from './datos';
import type { DatosReserva, PropiedadPublica } from './datos';

const ICONO_SERVICIO: Record<string, LucideIcon> = { Luz: Zap, 'Agua potable': Droplets, Alcantarillado: Waves };

function Carrusel({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [i, setI] = useState(0);
  if (fotos.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-3xl bg-surface-2 text-muted">
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }
  const ir = (d: number) => setI((x) => (x + d + fotos.length) % fotos.length);
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-surface-2">
      <img key={fotos[i]} src={fotos[i]} alt={`${nombre}, foto ${i + 1} de ${fotos.length}`} className="h-full w-full animate-fade-up object-cover" />
      {fotos.length > 1 && (
        <>
          <button type="button" aria-label="Foto anterior" onClick={() => ir(-1)} className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-primary">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Foto siguiente" onClick={() => ir(1)} className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-primary">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {fotos.map((f, n) => (
              <button key={f} type="button" aria-label={`Ver foto ${n + 1}`} onClick={() => setI(n)} className={cn('h-1.5 rounded-full transition-all', n === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50')} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type Paso = 'ficha' | 'reserva' | 'exito';
const VACIO: DatosReserva = { nombre: '', apellido: '', cedula: '', telefono: '', correo: '', fecha: '', hora: '' };

export function FichaPropiedad({ propiedad, onCerrar }: { propiedad: PropiedadPublica | null; onCerrar: () => void }) {
  const [paso, setPaso] = useState<Paso>('ficha');
  const [form, setForm] = useState<DatosReserva>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof DatosReserva, string>>>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [codCita, setCodCita] = useState<number | null>(null);

  const hoy = hoyEcuador();
  const cod = propiedad?.cod_propiedad ?? null;

  // Al abrir otra propiedad se vuelve a la ficha (se conservan los datos personales ya escritos).
  useEffect(() => {
    setPaso('ficha');
    setErrores({});
    setErrorEnvio(null);
    setForm((f) => ({ ...f, fecha: '', hora: '' }));
  }, [cod]);

  const ocupados = useConsulta(async () => {
    if (cod == null || !form.fecha) return [] as string[];
    const horas = exigir(await supabase.rpc('horarios_ocupados', { p_cod_propiedad: cod, p_fecha: form.fecha }));
    return horas.map((h) => String(h).slice(0, 5));
  }, [cod, form.fecha]);

  if (!propiedad) return <Modal abierto={false} onCerrar={onCerrar}>{null}</Modal>;

  const fotos = fotosOrdenadas(propiedad);
  const acabados = nivelAcabados(propiedad);
  const cambiar = (campo: keyof DatosReserva) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const horaLibre = (h: string) => !(ocupados.datos ?? []).includes(h) && !(form.fecha === hoy && Number(h.slice(0, 2)) <= horaActualEcuador());

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErrorEnvio(null);
    const resultado = esquemaReserva.safeParse(form);
    if (!resultado.success) {
      const nuevos: Partial<Record<keyof DatosReserva, string>> = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof DatosReserva;
        nuevos[campo] ??= issue.message;
      }
      setErrores(nuevos);
      return;
    }
    if (resultado.data.fecha < hoy) {
      setErrores({ fecha: 'La fecha debe ser de hoy en adelante.' });
      return;
    }
    setErrores({});
    setEnviando(true);
    const d = resultado.data;
    const { data, error } = await supabase.rpc('agendar_visita', {
      p_cedula: d.cedula,
      p_nombre: d.nombre,
      p_apellido: d.apellido,
      p_telefono: d.telefono,
      p_correo: d.correo,
      p_cod_propiedad: propiedad.cod_propiedad,
      p_fecha: d.fecha,
      p_hora: d.hora,
    });
    if (error) {
      setEnviando(false);
      setErrorEnvio(mensajeError(error));
      ocupados.recargar();
      return;
    }
    // La confirmación por WhatsApp no bloquea la reserva: si falla, queda pendiente y se reintenta.
    void supabase.functions.invoke('enviar-whatsapp', { body: { cod_cita: data } }).catch(() => undefined);
    setCodCita(data);
    setEnviando(false);
    setPaso('exito');
  };

  const error = (campo: keyof DatosReserva) => errores[campo] && <span className="mt-1 block text-xs text-danger">{errores[campo]}</span>;

  return (
    <Modal abierto onCerrar={onCerrar} ancho="lg" titulo={paso === 'ficha' ? propiedad.tipo_propiedad.nombre : paso === 'reserva' ? 'Agendar visita' : 'Visita agendada'}>
      {paso === 'ficha' && (
        <div className="grid grid-cols-1 gap-6 pb-2 lg:grid-cols-2">
          <Carrusel fotos={fotos} nombre={propiedad.nombre_comercial} />
          <div className="min-w-0">
            <h3 className="text-2xl font-medium leading-tight text-text">{propiedad.nombre_comercial}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-4 w-4 shrink-0" />
              {propiedad.sector.nombre}, {propiedad.sector.ciudad}
            </p>
            <p className="mt-4 text-kpi-lg font-light text-text">{usd(propiedad.precio_usd)}</p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-surface-2/70 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Ruler className="h-3.5 w-3.5" /> Terreno
                </p>
                <p className="mt-1 text-lg font-light text-text">{propiedad.area_terreno_m2 == null ? 'No aplica' : `${numero(propiedad.area_terreno_m2)} m²`}</p>
              </div>
              <div className="rounded-2xl bg-surface-2/70 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Ruler className="h-3.5 w-3.5" /> Construcción
                </p>
                <p className="mt-1 text-lg font-light text-text">{propiedad.area_construccion_m2 == null ? 'No aplica' : `${numero(propiedad.area_construccion_m2)} m²`}</p>
              </div>
            </div>

            <p className="mb-2 mt-5 text-[13px] text-muted">Servicios básicos</p>
            <div className="space-y-2">
              {propiedad.propiedad_servicio.map((s) => {
                const Icono = ICONO_SERVICIO[s.servicio_basico.nombre] ?? Zap;
                return (
                  <div key={s.servicio_basico.nombre} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2/70 px-3 py-2.5">
                    <span className="flex items-center gap-2.5 text-sm text-text">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-primary">
                        <Icono className="h-4 w-4" />
                      </span>
                      {s.servicio_basico.nombre}
                    </span>
                    <PildoraEstado estado={s.estado_servicio} />
                  </div>
                );
              })}
            </div>

            {acabados && (
              <p className="mt-4 flex items-center gap-2 text-sm text-text">
                <Sparkles className="h-4 w-4 text-primary" />
                Acabados de nivel <span className="font-medium">{acabados}</span>
              </p>
            )}
            {propiedad.descripcion && <p className="mt-3 text-sm leading-relaxed text-muted">{propiedad.descripcion}</p>}
            <p className="mt-3 text-xs text-muted">{propiedad.direccion}</p>

            <Button tamano="lg" icono={CalendarCheck} className="mt-6 w-full" onClick={() => setPaso('reserva')}>
              Agendar visita
            </Button>
          </div>
        </div>
      )}

      {paso === 'reserva' && (
        <form onSubmit={enviar} noValidate className="pb-2">
          <button type="button" onClick={() => setPaso('ficha')} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted transition hover:text-text">
            <ArrowLeft className="h-3.5 w-3.5" /> {propiedad.nombre_comercial}
          </button>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="etiqueta">Nombre</span>
              <input className="campo" autoComplete="given-name" value={form.nombre} onChange={cambiar('nombre')} />
              {error('nombre')}
            </label>
            <label className="block">
              <span className="etiqueta">Apellido</span>
              <input className="campo" autoComplete="family-name" value={form.apellido} onChange={cambiar('apellido')} />
              {error('apellido')}
            </label>
            <label className="block">
              <span className="etiqueta">Cédula</span>
              <input className="campo" inputMode="numeric" maxLength={10} placeholder="10 dígitos" value={form.cedula} onChange={cambiar('cedula')} />
              {error('cedula')}
            </label>
            <label className="block">
              <span className="etiqueta">Teléfono (WhatsApp)</span>
              <input className="campo" inputMode="tel" autoComplete="tel" maxLength={10} placeholder="09XXXXXXXX" value={form.telefono} onChange={cambiar('telefono')} />
              {error('telefono')}
            </label>
            <label className="block sm:col-span-2">
              <span className="etiqueta">Correo</span>
              <input className="campo" type="email" autoComplete="email" placeholder="tu@correo.com" value={form.correo} onChange={cambiar('correo')} />
              {error('correo')}
            </label>
            <label className="block sm:col-span-2">
              <span className="etiqueta">Fecha de la visita</span>
              <input
                className="campo"
                type="date"
                min={hoy}
                max={sumarDias(hoy, 90)}
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value, hora: '' }))}
              />
              {error('fecha')}
            </label>
          </div>

          <p className="etiqueta mt-4">Horario (09:00 a 18:00)</p>
          {!form.fecha ? (
            <p className="rounded-2xl bg-surface-2/60 px-4 py-4 text-center text-[13px] text-muted">Elige primero una fecha para ver los horarios disponibles.</p>
          ) : ocupados.cargando ? (
            <Skeleton className="h-11 rounded-full" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {HORARIOS.map((h) => {
                const libre = horaLibre(h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={!libre}
                    aria-pressed={form.hora === h}
                    onClick={() => setForm((f) => ({ ...f, hora: h }))}
                    className={cn(
                      'h-10 rounded-full border px-4 text-sm transition',
                      form.hora === h
                        ? 'border-transparent bg-primary-grad text-white shadow-primary'
                        : libre
                          ? 'border-border bg-surface-2 text-text hover:bg-surface-3'
                          : 'cursor-not-allowed border-border bg-surface-2/40 text-muted/50 line-through',
                    )}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          )}
          {error('hora')}
          {ocupados.error && <span className="mt-1 block text-xs text-danger">{ocupados.error}</span>}

          {errorEnvio && (
            <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-[13px] text-danger">
              {errorEnvio}
            </p>
          )}

          <Button type="submit" tamano="lg" icono={CalendarCheck} cargando={enviando} className="mt-6 w-full">
            Confirmar visita
          </Button>
          <p className="mt-3 text-center text-xs text-muted">Te enviaremos la confirmación y un recordatorio por WhatsApp.</p>
        </form>
      )}

      {paso === 'exito' && (
        <div className="flex flex-col items-center pb-4 pt-2 text-center">
          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success shadow-success">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h3 className="text-2xl font-light text-text">¡Tu visita está agendada!</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted">
            {form.nombre.trim()}, te esperamos. Recibirás la confirmación por WhatsApp al {form.telefono}.
          </p>
          <dl className="mt-6 w-full max-w-sm space-y-2.5 rounded-3xl bg-surface-2/70 p-5 text-left text-sm">
            {[
              ['Propiedad', propiedad.nombre_comercial],
              ['Dirección', propiedad.direccion],
              ['Fecha', fechaLarga(form.fecha)],
              ['Hora', form.hora],
              ['Código de cita', codCita == null ? '—' : `#${codCita}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted">{k}</dt>
                <dd className="text-right text-text first-letter:uppercase">{v}</dd>
              </div>
            ))}
          </dl>
          <Button variante="secundario" className="mt-6" onClick={onCerrar}>
            Volver al mapa
          </Button>
        </div>
      )}
    </Modal>
  );
}
