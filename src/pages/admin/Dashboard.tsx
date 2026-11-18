import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, CalendarDays, CalendarX2, HandCoins, UserPlus } from 'lucide-react';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { BarrasHorizontales, GraficoArea, GraficoBarras, Heatmap } from '../../components/graficos';
import type { Punto } from '../../components/graficos';
import { Avatar, Card, EstadoVacio, FilaLista, PildoraEstado, Segmentado, Skeleton, TarjetaKpi, TarjetaPromo, textoEstado } from '../../components/ui/basicos';
import { exigir, useConsulta } from '../../lib/datos';
import { supabase } from '../../lib/supabase';
import { fechaCorta, fechaLocal, horaCorta, hoyEcuador, numero, usd } from '../../lib/utilidades';

const COLOR_ETAPA: Record<string, string> = {
  interesado: '#A3948A',
  cita_agendada: '#FF7A2F',
  'visitó': '#FFB078',
  anticipo: '#F5C451',
  vendido: '#5EE6A8',
  descartado: '#F87171',
};
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HORAS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

const mesCorto = (iso: string) => {
  const t = fechaLocal(iso).toLocaleDateString('es-EC', { month: 'short' }).replace('.', '');
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const mesLargo = (iso: string) => fechaLocal(iso).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });

function ErrorTarjeta({ mensaje }: { mensaje: string }) {
  return (
    <p className="flex items-center gap-2 py-6 text-[13px] text-danger">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {mensaje}
    </p>
  );
}

export default function Dashboard() {
  const navegar = useNavigate();
  const [periodo, setPeriodo] = useState(12);

  const kpis = useConsulta(async () => exigir(await supabase.rpc('dashboard_kpis')), []);
  const clientes = useConsulta(async () => exigir(await supabase.rpc('dashboard_clientes_registrados', { p_meses: periodo })), [periodo]);
  const ventas = useConsulta(async () => exigir(await supabase.rpc('dashboard_ventas_por_mes', { p_meses: 8 })), []);
  const embudo = useConsulta(async () => exigir(await supabase.rpc('dashboard_embudo')), []);
  const heatmap = useConsulta(async () => exigir(await supabase.rpc('dashboard_heatmap_citas')), []);
  const citas = useConsulta(
    async () =>
      exigir(
        await supabase
          .from('v_cita_detalle')
          .select('*')
          .gte('fecha', hoyEcuador())
          .eq('estado_cita', 'agendada')
          .order('fecha')
          .order('hora')
          .limit(6),
      ),
    [],
  );
  const recuperar = useConsulta(async () => {
    const { count, error } = await supabase.from('v_cliente_cartera').select('cedula', { count: 'exact', head: true }).eq('para_recuperar', true);
    if (error) throw error;
    return count ?? 0;
  }, []);

  const kpi = (nombre: string) => kpis.datos?.find((k) => k.indicador === nombre);
  const tarjetas = [
    { clave: 'propiedades_disponibles', etiqueta: 'Propiedades disponibles', icono: Building2, a: '/admin/propiedades', formato: numero },
    { clave: 'citas_semana', etiqueta: 'Citas esta semana', icono: CalendarDays, a: '/admin/citas', formato: numero, texto: 'vs semana anterior' },
    { clave: 'clientes_nuevos_mes', etiqueta: 'Clientes nuevos del mes', icono: UserPlus, a: '/admin/clientes', formato: numero },
    { clave: 'anticipos_mes_usd', etiqueta: 'Anticipos del mes', icono: HandCoins, a: '/admin/embudo', formato: (v: number) => usd(v) },
  ];

  const puntosClientes: Punto[] = (clientes.datos ?? []).map((p) =>
    periodo <= 1
      ? { etiqueta: fechaCorta(p.periodo), valor: Number(p.total), detalle: fechaCorta(p.periodo) }
      : { etiqueta: mesCorto(p.periodo), valor: Number(p.total), detalle: mesLargo(p.periodo) },
  );
  const puntosVentas: Punto[] = (ventas.datos ?? []).map((p) => ({ etiqueta: mesCorto(p.mes), valor: Number(p.total), detalle: mesLargo(p.mes) }));
  const mapaCalor = new Map((heatmap.datos ?? []).map((c) => [`${c.dia_semana}-${c.hora}`, Number(c.total)]));
  const totalClientes = puntosClientes.reduce((a, p) => a + p.valor, 0);

  return (
    <>
      <EncabezadoPagina titulo="Dashboard" descripcion="Resumen de propiedades, citas y ventas." />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* KPIs 2×2 */}
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:col-span-5">
          {tarjetas.map((t) => {
            const k = kpi(t.clave);
            if (kpis.cargando && !kpis.datos) return <Skeleton key={t.clave} className="h-[164px] rounded-3xl" />;
            return (
              <TarjetaKpi
                key={t.clave}
                icono={t.icono}
                etiqueta={t.etiqueta}
                valor={k ? t.formato(Number(k.valor)) : '—'}
                variacion={k?.variacion_pct == null ? null : Number(k.variacion_pct)}
                textoVariacion={t.texto}
                onAbrir={() => navegar(t.a)}
              />
            );
          })}
        </div>

        {/* Área: clientes registrados */}
        <Card
          className="xl:col-span-7"
          titulo="Clientes registrados"
          subtitulo={clientes.datos ? `${numero(totalClientes)} en el periodo` : 'Altas en la cartera'}
          acciones={
            <Segmentado
              valor={periodo}
              onCambio={setPeriodo}
              opciones={[
                { valor: 12, texto: '1 año' },
                { valor: 6, texto: '6 meses' },
                { valor: 3, texto: '3 meses' },
                { valor: 1, texto: '1 mes' },
              ]}
            />
          }
        >
          {clientes.error ? (
            <ErrorTarjeta mensaje={clientes.error} />
          ) : !clientes.datos ? (
            <Skeleton className="h-[260px]" />
          ) : (
            <GraficoArea datos={puntosClientes} unidad={'clientes'} alto={260} />
          )}
        </Card>

        {/* Barras: vendidas por mes */}
        <Card className="xl:col-span-4" titulo="Propiedades vendidas" subtitulo="Últimos 8 meses" onAbrir={() => navegar('/admin/embudo')}>
          {ventas.error ? <ErrorTarjeta mensaje={ventas.error} /> : !ventas.datos ? <Skeleton className="h-[240px]" /> : <GraficoBarras datos={puntosVentas} />}
        </Card>

        {/* Embudo */}
        <Card className="xl:col-span-4" titulo="Embudo de ventas" subtitulo="Intereses por etapa" onAbrir={() => navegar('/admin/embudo')}>
          {embudo.error ? (
            <ErrorTarjeta mensaje={embudo.error} />
          ) : !embudo.datos ? (
            <Skeleton className="h-[240px]" />
          ) : (
            <BarrasHorizontales
              datos={embudo.datos.map((e) => ({ etiqueta: textoEstado(e.etapa), valor: Number(e.total), color: COLOR_ETAPA[e.etapa] ?? '#A3948A' }))}
            />
          )}
        </Card>

        {/* Heatmap */}
        <Card className="xl:col-span-4" titulo="Citas por día y hora" subtitulo="Franjas con más visitas" onAbrir={() => navegar('/admin/citas')}>
          {heatmap.error ? (
            <ErrorTarjeta mensaje={heatmap.error} />
          ) : !heatmap.datos ? (
            <Skeleton className="h-[240px]" />
          ) : (
            <Heatmap filas={DIAS} columnas={HORAS.map(String)} valor={(f, c) => mapaCalor.get(`${f + 1}-${HORAS[c]}`) ?? 0} />
          )}
        </Card>

        {/* Próximas citas */}
        <Card className="xl:col-span-8" titulo="Próximas citas" subtitulo="Visitas agendadas" onAbrir={() => navegar('/admin/citas')}>
          {citas.error ? (
            <ErrorTarjeta mensaje={citas.error} />
          ) : !citas.datos ? (
            <div className="space-y-2.5">
              <Skeleton className="h-[68px]" />
              <Skeleton className="h-[68px]" />
              <Skeleton className="h-[68px]" />
            </div>
          ) : citas.datos.length === 0 ? (
            <EstadoVacio icono={CalendarX2} titulo="No hay citas próximas" descripcion="Cuando un cliente agende una visita aparecerá aquí al instante." />
          ) : (
            <div className="space-y-2.5">
              {citas.datos.map((c) => (
                <FilaLista
                  key={c.cod_cita}
                  avatar={<Avatar nombre={c.nombre ?? '?'} apellido={c.apellido ?? ''} />}
                  titulo={`${c.nombre ?? ''} ${c.apellido ?? ''}`}
                  detalle={`${c.nombre_comercial ?? ''} · ${c.fecha ? fechaCorta(c.fecha) : ''} · ${c.hora ? horaCorta(c.hora) : ''}`}
                  derecha={<PildoraEstado estado={c.estado_cita ?? 'agendada'} />}
                  onClick={() => navegar('/admin/citas')}
                />
              ))}
            </div>
          )}
        </Card>

        <div className="min-w-0 xl:col-span-4">
          <TarjetaPromo
            titulo="Recupera clientes sin contacto"
            texto={
              recuperar.datos == null
                ? 'Clientes descartados o sin seguimiento en 30 días.'
                : `${numero(recuperar.datos)} ${recuperar.datos === 1 ? 'cliente descartado o sin contacto' : 'clientes descartados o sin contacto'} en 30 días.`
            }
            accion="Ver cartera"
            onAccion={() => navegar('/admin/clientes?filtro=recuperar')}
          />
        </div>
      </div>
    </>
  );
}
