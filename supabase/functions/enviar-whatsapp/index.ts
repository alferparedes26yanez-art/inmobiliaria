// Edge Function: enviar-whatsapp
// Recibe { cod_notificacion } (o { cod_cita } para enviar las pendientes de esa cita),
// envía el mensaje por WhatsApp y actualiza estado_envio y fecha_envio.
//
// Modos:
//   - Simulado (por defecto): solo registra el mensaje en los logs y lo marca como "enviado".
//   - Twilio WhatsApp API: se activa si existen los secrets TWILIO_ACCOUNT_SID,
//     TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

/** 0991234567 -> +593991234567 */
function telefonoInternacional(telefono: string): string {
  return '+593' + telefono.trim().replace(/^0/, '');
}

const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM');
const MODO = TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM ? 'twilio' : 'simulado';

async function enviarPorTwilio(destino: string, mensaje: string): Promise<void> {
  const desde = TWILIO_FROM!.startsWith('whatsapp:') ? TWILIO_FROM! : `whatsapp:${TWILIO_FROM}`;
  const respuesta = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: desde, To: `whatsapp:${destino}`, Body: mensaje }),
  });
  if (!respuesta.ok) {
    throw new Error(`Twilio respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 300)}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return responder({ error: 'Método no permitido.' }, 405);

  let cuerpo: { cod_notificacion?: unknown; cod_cita?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: 'El cuerpo debe ser JSON.' }, 400);
  }
  const codNotificacion = Number(cuerpo.cod_notificacion);
  const codCita = Number(cuerpo.cod_cita);
  if (!Number.isInteger(codNotificacion) && !Number.isInteger(codCita)) {
    return responder({ error: 'Envía cod_notificacion o cod_cita.' }, 400);
  }

  // La service_role solo vive aquí, en el servidor: nunca llega al frontend.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let consulta = supabase
    .from('notificacion_whatsapp')
    .select('cod_notificacion, mensaje, estado_envio, cita!inner(cod_cita, interes!inner(cliente!inner(nombre, telefono)))');
  consulta = Number.isInteger(codNotificacion)
    ? consulta.eq('cod_notificacion', codNotificacion)
    : consulta.eq('cod_cita', codCita).eq('estado_envio', 'pendiente');

  const { data: notificaciones, error } = await consulta;
  if (error) return responder({ error: 'No se pudo leer la notificación.', detalle: error.message }, 500);
  if (!notificaciones?.length) return responder({ error: 'No hay notificaciones para enviar.' }, 404);

  const resultados = [];
  for (const n of notificaciones) {
    // Ya enviada: no se repite (la función se puede llamar varias veces sin duplicar mensajes).
    if (n.estado_envio === 'enviado') {
      resultados.push({ cod_notificacion: n.cod_notificacion, estado_envio: 'enviado', omitida: true });
      continue;
    }
    // deno-lint-ignore no-explicit-any
    const cliente = (n as any).cita.interes.cliente as { nombre: string; telefono: string };
    const destino = telefonoInternacional(cliente.telefono);
    let estado: 'enviado' | 'fallido' = 'enviado';
    let detalle: string | undefined;

    try {
      if (MODO === 'twilio') await enviarPorTwilio(destino, n.mensaje);
      else console.log(`[WhatsApp simulado] para ${destino}: ${n.mensaje}`);
    } catch (e) {
      estado = 'fallido';
      detalle = e instanceof Error ? e.message : String(e);
      console.error(`[WhatsApp] falló la notificación ${n.cod_notificacion}: ${detalle}`);
    }

    const { error: errorUpdate } = await supabase
      .from('notificacion_whatsapp')
      .update({ estado_envio: estado, fecha_envio: estado === 'enviado' ? new Date().toISOString() : null })
      .eq('cod_notificacion', n.cod_notificacion);
    if (errorUpdate) detalle = `Se procesó pero no se pudo guardar el estado: ${errorUpdate.message}`;

    resultados.push({ cod_notificacion: n.cod_notificacion, estado_envio: estado, detalle });
  }

  return responder({ modo: MODO, resultados });
});
