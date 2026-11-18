import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import { refrescarTodo } from './datos';
import { supabase } from './supabase';
import { fechaCorta, horaCorta } from './utilidades';

/**
 * Se suscribe con Supabase Realtime a los INSERT de la tabla cita.
 * Cuando un cliente agenda: toast, punto naranja en la campana y recarga de las consultas abiertas.
 */
export function useCitasNuevas(activo: boolean) {
  const toast = useToast();
  const [hayNuevas, setHayNuevas] = useState(false);

  useEffect(() => {
    if (!activo) return;
    const canal = supabase
      .channel('citas-nuevas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cita' }, async (evento) => {
        const codCita = (evento.new as { cod_cita?: number }).cod_cita;
        setHayNuevas(true);
        refrescarTodo();
        if (codCita == null) return;
        const { data } = await supabase.from('v_cita_detalle').select('*').eq('cod_cita', codCita).maybeSingle();
        toast.info(
          'Nueva cita agendada',
          data
            ? `${data.nombre} ${data.apellido} · ${data.nombre_comercial} · ${data.fecha ? fechaCorta(data.fecha) : ''} ${data.hora ? horaCorta(data.hora) : ''}`
            : 'Un cliente acaba de agendar una visita.',
        );
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [activo, toast]);

  const marcarVistas = useCallback(() => setHayNuevas(false), []);
  return { hayNuevas, marcarVistas };
}
