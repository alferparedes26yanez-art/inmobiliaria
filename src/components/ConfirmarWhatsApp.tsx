import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { mensajeError } from '../lib/datos';
import { supabase } from '../lib/supabase';
import type { Vista } from '../lib/supabase';
import { fechaLarga, horaCorta, telefonoInternacional } from '../lib/utilidades';
import { Button } from './ui/basicos';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

type Cita = Vista<'v_cita_detalle'>;

/** Prefijo con el que se guarda la confirmación en seguimiento_cliente; sirve para saber qué citas ya se confirmaron. */
const PREFIJO = 'Confirmación de visita #';

/** Devuelve los códigos de cita que ya se confirmaron por WhatsApp. */
export async function citasConfirmadas(): Promise<Set<number>> {
  const { data, error } = await supabase.from('seguimiento_cliente').select('mensaje').like('mensaje', `${PREFIJO}%`);
  if (error) throw error;
  const codigos = (data ?? []).map((s) => Number(s.mensaje.slice(PREFIJO.length).match(/^\d+/)?.[0])).filter(Number.isInteger);
  return new Set(codigos);
}

function mensajeConfirmacion(c: Cita, asesor: string): string {
  const fecha = c.fecha ? fechaLarga(c.fecha) : '';
  const hora = c.hora ? horaCorta(c.hora) : '';
  return [
    `Hola ${c.nombre}, te saluda ${asesor} de la inmobiliaria. 👋`,
    '',
    `Te confirmo tu visita a *${c.nombre_comercial}*:`,
    `📅 ${fecha.charAt(0).toUpperCase() + fecha.slice(1)}`,
    `🕒 ${hora}`,
    c.direccion ? `📍 ${c.direccion}` : '',
    '',
    'Si necesitas cambiar el horario, respóndeme por aquí. ¡Te esperamos!',
  ]
    .filter((linea, i, todas) => linea !== '' || todas[i - 1] !== '')
    .join('\n');
}

/**
 * Abre WhatsApp (desde el teléfono o WhatsApp Web del asesor) con la confirmación de la cita ya escrita
 * y registra el contacto en el historial de seguimiento del cliente.
 */
export function ModalConfirmarWhatsApp({ cita, onCerrar, onEnviado }: { cita: Cita | null; onCerrar: () => void; onEnviado: () => void }) {
  const { admin } = useAuth();
  const toast = useToast();
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (cita) setTexto(mensajeConfirmacion(cita, admin?.nombre ?? 'tu asesor'));
  }, [cita?.cod_cita]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async () => {
    if (!cita || !admin) return;
    if (!texto.trim()) {
      toast.error('Escribe un mensaje', 'El mensaje no puede estar vacío.');
      return;
    }
    // La ventana se abre dentro del clic para que el navegador no la bloquee.
    window.open(`https://wa.me/${telefonoInternacional(cita.telefono ?? '')}?text=${encodeURIComponent(texto.trim())}`, '_blank', 'noopener');
    setGuardando(true);
    const { error } = await supabase.from('seguimiento_cliente').insert({
      cedula: cita.cedula ?? '',
      usuario: admin.usuario,
      medio: 'WhatsApp',
      mensaje: `${PREFIJO}${cita.cod_cita} enviada por WhatsApp:\n${texto.trim()}`,
    });
    setGuardando(false);
    if (error) {
      toast.error('Se abrió WhatsApp, pero no se pudo registrar', mensajeError(error));
      return;
    }
    toast.exito('Confirmación lista en WhatsApp', `Pulsa "Enviar" en el chat de ${cita.nombre}. Quedó registrada en su historial.`);
    onEnviado();
    onCerrar();
  };

  return (
    <Modal
      abierto={cita !== null}
      onCerrar={() => !guardando && onCerrar()}
      titulo="Confirmar por WhatsApp"
      ancho="md"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button icono={Send} onClick={enviar} cargando={guardando}>
            Abrir WhatsApp
          </Button>
        </>
      }
    >
      {cita && (
        <>
          <p className="mb-3 text-sm text-muted">
            Se abrirá tu WhatsApp con el chat de{' '}
            <span className="text-text">
              {cita.nombre} {cita.apellido}
            </span>{' '}
            (+{telefonoInternacional(cita.telefono ?? '')}) y este mensaje ya escrito. Puedes editarlo antes.
          </p>
          <textarea className="campo" rows={9} value={texto} onChange={(e) => setTexto(e.target.value)} />
        </>
      )}
    </Modal>
  );
}
