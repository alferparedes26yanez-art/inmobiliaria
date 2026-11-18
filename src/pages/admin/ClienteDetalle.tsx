import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CalendarX2, Mail, MessageCircle, MessagesSquare, Phone, Plus, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { Avatar, Button, Card, EstadoVacio, FilaLista, PildoraEstado, Skeleton } from '../../components/ui/basicos';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { exigir, mensajeError, useConsulta } from '../../lib/datos';
import { supabase } from '../../lib/supabase';
import { fechaCorta, fechaHora, haceCuanto, horaCorta, telefonoInternacional, usd } from '../../lib/utilidades';

const ICONO_MEDIO: Record<string, LucideIcon> = { WhatsApp: MessageCircle, llamada: Phone, correo: Mail };
const MEDIOS = ['WhatsApp', 'llamada', 'correo'];

export default function ClienteDetalle() {
  const { cedula = '' } = useParams();
  const { admin } = useAuth();
  const toast = useToast();

  const detalle = useConsulta(async () => {
    const [cliente, intereses, citas, seguimientos] = await Promise.all([
      supabase.from('v_cliente_cartera').select('*').eq('cedula', cedula).maybeSingle(),
      supabase.from('interes').select('*, propiedad(nombre_comercial, precio_usd)').eq('cedula', cedula).order('fecha_actualizacion', { ascending: false }),
      supabase.from('v_cita_detalle').select('*').eq('cedula', cedula).order('fecha', { ascending: false }).order('hora', { ascending: false }),
      supabase.from('seguimiento_cliente').select('*, usuario_admin(nombre, apellido)').eq('cedula', cedula).order('fecha', { ascending: false }),
    ]);
    return { cliente: exigir(cliente), intereses: exigir(intereses), citas: exigir(citas), seguimientos: exigir(seguimientos) };
  }, [cedula]);

  const [whatsapp, setWhatsapp] = useState<string | null>(null); // mensaje en edición
  const [nota, setNota] = useState<{ medio: string; mensaje: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const volver = (
    <Link to="/admin/clientes">
      <Button variante="secundario" icono={ArrowLeft}>
        Volver
      </Button>
    </Link>
  );

  if (detalle.error || (detalle.datos && !detalle.datos.cliente)) {
    return (
      <>
        <EncabezadoPagina titulo="Cliente" acciones={volver} />
        <Card>
          <EstadoVacio icono={AlertCircle} titulo="No se pudo abrir el cliente" descripcion={detalle.error ?? 'El cliente no existe.'} />
        </Card>
      </>
    );
  }

  if (!detalle.datos?.cliente) {
    return (
      <>
        <EncabezadoPagina titulo="Cliente" acciones={volver} />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl xl:col-span-2" />
        </div>
      </>
    );
  }

  const { cliente, intereses, citas, seguimientos } = detalle.datos;
  const nombre = cliente.nombre ?? '';
  const telefono = cliente.telefono ?? '';

  const registrar = async (medio: string, mensaje: string) => {
    if (!admin) return false;
    const { error } = await supabase.from('seguimiento_cliente').insert({ cedula, usuario: admin.usuario, medio, mensaje: mensaje.trim() });
    if (error) {
      toast.error('No se pudo registrar el seguimiento', mensajeError(error));
      return false;
    }
    detalle.recargar();
    return true;
  };

  const abrirWhatsApp = () => {
    const propiedad = cliente.propiedad_actual ? ` sobre "${cliente.propiedad_actual}"` : '';
    setWhatsapp(`Hola ${nombre}, te saluda ${admin?.nombre ?? 'tu asesor'} de la inmobiliaria. Te escribo${propiedad} para saber si podemos ayudarte en algo más.`);
  };

  const enviarWhatsApp = async () => {
    if (!whatsapp?.trim()) {
      toast.error('Escribe un mensaje', 'El mensaje no puede estar vacío.');
      return;
    }
    // La ventana se abre dentro del clic para que el navegador no la bloquee.
    window.open(`https://wa.me/${telefonoInternacional(telefono)}?text=${encodeURIComponent(whatsapp.trim())}`, '_blank', 'noopener');
    setGuardando(true);
    const ok = await registrar('WhatsApp', whatsapp);
    setGuardando(false);
    if (ok) {
      toast.exito('Contacto registrado', 'Se abrió WhatsApp y se guardó en el historial.');
      setWhatsapp(null);
    }
  };

  const guardarNota = async () => {
    if (!nota || nota.mensaje.trim().length < 3) {
      toast.error('Escribe el detalle', 'Describe brevemente el contacto con el cliente.');
      return;
    }
    setGuardando(true);
    const ok = await registrar(nota.medio, nota.mensaje);
    setGuardando(false);
    if (ok) {
      toast.exito('Seguimiento registrado');
      setNota(null);
    }
  };

  return (
    <>
      <EncabezadoPagina
        titulo={`${nombre} ${cliente.apellido ?? ''}`}
        descripcion={`Cliente desde ${cliente.fecha_registro ? fechaHora(cliente.fecha_registro) : ''}`}
        acciones={
          <>
            {volver}
            <Button icono={MessageCircle} onClick={abrirWhatsApp}>
              Escribir por WhatsApp
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="min-w-0 space-y-5">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar nombre={nombre} apellido={cliente.apellido ?? ''} tamano="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-medium text-text">
                  {nombre} {cliente.apellido}
                </p>
                {cliente.etapa_actual ? <PildoraEstado estado={cliente.etapa_actual} className="mt-1" /> : <span className="text-xs text-muted">Sin intereses</span>}
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ['Cédula', cliente.cedula],
                ['Teléfono', telefono],
                ['Correo', cliente.correo],
                ['Último contacto', haceCuanto(cliente.ultimo_contacto)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="truncate text-text">{v}</dd>
                </div>
              ))}
            </dl>
            {cliente.para_recuperar && (
              <p className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-[13px] text-danger">Cliente para recuperar: está descartado o lleva más de 30 días sin contacto.</p>
            )}
          </Card>

          <Card titulo="Intereses" subtitulo={`${intereses.length} ${intereses.length === 1 ? 'propiedad' : 'propiedades'}`}>
            {intereses.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted">Sin intereses registrados.</p>
            ) : (
              <div className="space-y-2">
                {intereses.map((i) => (
                  <FilaLista
                    key={i.cod_interes}
                    titulo={i.propiedad.nombre_comercial}
                    detalle={`${usd(i.propiedad.precio_usd)}${i.monto_anticipo_usd != null ? ` · anticipo ${usd(i.monto_anticipo_usd, true)}` : ''}`}
                    derecha={<PildoraEstado estado={i.etapa} />}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Card
            titulo="Historial de seguimiento"
            subtitulo="Contactos realizados con el cliente"
            acciones={
              <Button variante="secundario" tamano="sm" icono={Plus} onClick={() => setNota({ medio: 'llamada', mensaje: '' })}>
                Registrar contacto
              </Button>
            }
          >
            {seguimientos.length === 0 ? (
              <EstadoVacio icono={MessagesSquare} titulo="Aún no hay seguimientos" descripcion="Escríbele por WhatsApp o registra una llamada para empezar el historial." />
            ) : (
              <ol className="space-y-2.5">
                {seguimientos.map((s) => {
                  const Icono = ICONO_MEDIO[s.medio] ?? MessageCircle;
                  return (
                    <li key={s.cod_seguimiento} className="flex gap-3 rounded-2xl bg-surface-2/70 p-3.5">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Icono className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted">
                          <span>
                            <span className="font-medium text-text">{s.medio}</span> · {s.usuario_admin.nombre} {s.usuario_admin.apellido}
                          </span>
                          <span>{fechaHora(s.fecha)}</span>
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-text/90">{s.mensaje}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card titulo="Citas" subtitulo={`${citas.length} ${citas.length === 1 ? 'visita' : 'visitas'}`}>
            {citas.length === 0 ? (
              <EstadoVacio icono={CalendarX2} titulo="Sin citas" descripcion="Este cliente todavía no ha agendado visitas." />
            ) : (
              <div className="space-y-2">
                {citas.map((c) => (
                  <FilaLista
                    key={c.cod_cita}
                    titulo={c.nombre_comercial}
                    detalle={`${c.fecha ? fechaCorta(c.fecha) : ''} · ${c.hora ? horaCorta(c.hora) : ''}`}
                    derecha={<PildoraEstado estado={c.estado_cita ?? 'agendada'} />}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* WhatsApp con mensaje prellenado */}
      <Modal
        abierto={whatsapp !== null}
        onCerrar={() => !guardando && setWhatsapp(null)}
        titulo="Escribir por WhatsApp"
        ancho="md"
        pie={
          <>
            <Button variante="secundario" onClick={() => setWhatsapp(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button icono={Send} onClick={enviarWhatsApp} cargando={guardando}>
              Abrir WhatsApp
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted">
          Se abrirá el chat con <span className="text-text">+{telefonoInternacional(telefono)}</span> y el contacto quedará registrado en el historial.
        </p>
        <textarea className="campo" rows={5} value={whatsapp ?? ''} onChange={(e) => setWhatsapp(e.target.value)} />
      </Modal>

      {/* Registrar llamada, correo u otro contacto */}
      <Modal
        abierto={nota !== null}
        onCerrar={() => !guardando && setNota(null)}
        titulo="Registrar contacto"
        ancho="md"
        pie={
          <>
            <Button variante="secundario" onClick={() => setNota(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardarNota} cargando={guardando}>
              Guardar
            </Button>
          </>
        }
      >
        {nota && (
          <div className="space-y-4">
            <label className="block">
              <span className="etiqueta">Medio</span>
              <select className="campo" value={nota.medio} onChange={(e) => setNota({ ...nota, medio: e.target.value })}>
                {MEDIOS.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="etiqueta">Detalle</span>
              <textarea className="campo" rows={4} placeholder="¿De qué hablaron? ¿Qué quedó pendiente?" value={nota.mensaje} onChange={(e) => setNota({ ...nota, mensaje: e.target.value })} />
            </label>
          </div>
        )}
      </Modal>
    </>
  );
}
