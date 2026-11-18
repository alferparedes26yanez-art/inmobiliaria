import { useState } from 'react';
import { Building2, CalendarDays, HandCoins, Inbox, Plus, Search, Send, Sparkles, Trash2, UserPlus } from 'lucide-react';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { BarrasHorizontales, GraficoArea, GraficoBarras, Heatmap } from '../../components/graficos';
import type { Punto } from '../../components/graficos';
import {
  Avatar,
  Button,
  Card,
  EstadoVacio,
  FilaLista,
  IconButton,
  PildoraEstado,
  Segmentado,
  Skeleton,
  TarjetaKpi,
  TarjetaPromo,
} from '../../components/ui/basicos';
import { Modal, ModalConfirmar } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { usd } from '../../lib/utilidades';

// Datos de muestra: esta pantalla solo sirve para revisar el sistema de diseño.
const MESES = ['Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'];
const CLIENTES: Punto[] = [4, 6, 5, 9, 8, 12, 10, 14, 13, 18, 16, 21].map((valor, i) => ({
  etiqueta: MESES[i],
  valor,
  detalle: `${MESES[i]} 2026`,
}));
const VENTAS: Punto[] = [2, 3, 1, 4, 3, 5, 4, 6].map((valor, i) => ({ etiqueta: MESES[i + 4], valor }));
const EMBUDO = [
  { etiqueta: 'Interesado', valor: 18, color: '#A3948A' },
  { etiqueta: 'Cita agendada', valor: 12, color: '#FF7A2F' },
  { etiqueta: 'Visitó', valor: 9, color: '#FFB078' },
  { etiqueta: 'Anticipo', valor: 5, color: '#F5C451' },
  { etiqueta: 'Vendido', valor: 3, color: '#5EE6A8' },
  { etiqueta: 'Descartado', valor: 4, color: '#F87171' },
];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HORAS = ['9', '10', '11', '12', '13', '14', '15', '16', '17'];
const CITAS = [
  { nombre: 'Carlos', apellido: 'Paredes', propiedad: 'Departamento Mirador La Carolina', cuando: 'Mañana · 10:00', estado: 'agendada' },
  { nombre: 'Gabriela', apellido: 'Núñez', propiedad: 'Suite Urban González Suárez', cuando: '18 nov · 15:00', estado: 'agendada' },
  { nombre: 'Luis', apellido: 'Sánchez', propiedad: 'Terreno Colinas de Tumbaco', cuando: '13 nov · 10:00', estado: 'realizada' },
  { nombre: 'Daniela', apellido: 'Cevallos', propiedad: 'Casa Hacienda Caranqui', cuando: '4 nov · 11:00', estado: 'no_asistió' },
];

export default function GuiaEstilo() {
  const toast = useToast();
  const [periodo, setPeriodo] = useState(12);
  const [modal, setModal] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  return (
    <>
      <EncabezadoPagina
        titulo="Guía de estilo"
        descripcion="Componentes base del sistema con datos de muestra."
        acciones={
          <>
            <Button variante="secundario" icono={Search} onClick={() => setModal(true)}>
              Abrir modal
            </Button>
            <Button icono={Plus} onClick={() => toast.exito('Propiedad guardada', 'Los cambios se aplicaron correctamente.')}>
              Nueva propiedad
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:col-span-1">
          <TarjetaKpi icono={Building2} etiqueta="Propiedades disponibles" valor="8" variacion={0} />
          <TarjetaKpi icono={CalendarDays} etiqueta="Citas esta semana" valor="5" variacion={-50} textoVariacion="vs semana anterior" />
          <TarjetaKpi icono={UserPlus} etiqueta="Clientes nuevos del mes" valor="21" variacion={31.3} />
          <TarjetaKpi icono={HandCoins} etiqueta="Anticipos del mes" valor={usd(13600)} variacion={72.2} />
        </div>

        <Card
          className="xl:col-span-2"
          titulo="Clientes registrados"
          subtitulo="Altas en la cartera por mes"
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
          <GraficoArea datos={CLIENTES.slice(-Math.max(periodo, 3))} unidad="clientes" alto={270} />
        </Card>

        <Card titulo="Propiedades vendidas" subtitulo="Últimos 8 meses" onAbrir={() => undefined}>
          <GraficoBarras datos={VENTAS} />
        </Card>

        <Card titulo="Embudo de ventas" subtitulo="Intereses por etapa" onAbrir={() => undefined}>
          <BarrasHorizontales datos={EMBUDO} />
        </Card>

        <Card titulo="Citas por día y hora" subtitulo="Franjas con más visitas">
          <Heatmap filas={DIAS} columnas={HORAS} valor={(f, c) => (f === 6 ? 0 : Math.max(0, Math.round(4 * Math.sin((f + 1) * (c + 2)) + (c % 4))))} />
        </Card>

        <Card className="xl:col-span-2" titulo="Próximas citas" onAbrir={() => undefined}>
          <div className="space-y-2.5">
            {CITAS.map((c) => (
              <FilaLista
                key={c.nombre}
                avatar={<Avatar nombre={c.nombre} apellido={c.apellido} />}
                titulo={`${c.nombre} ${c.apellido}`}
                detalle={`${c.propiedad} · ${c.cuando}`}
                derecha={<PildoraEstado estado={c.estado} />}
                onClick={() => undefined}
              />
            ))}
          </div>
        </Card>

        <div className="min-w-0 space-y-5">
          <TarjetaPromo
            titulo="Recupera clientes sin contacto"
            texto="8 clientes llevan más de 30 días sin seguimiento."
            accion="Ver cartera"
          />
          {/* Tarjeta de asistente */}
          <Card>
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
            <p className="text-xl font-light text-text">Hola, ¿en qué te ayudo?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Citas de hoy', 'Clientes por recuperar', 'Nueva propiedad'].map((t) => (
                <button key={t} type="button" className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted transition hover:bg-surface-3 hover:text-text">
                  {t}
                </button>
              ))}
            </div>
            <div className="relative mt-4">
              <input className="campo pr-12" placeholder="Escribe una consulta…" />
              <IconButton icono={Send} etiqueta="Enviar" tamano="sm" activo className="absolute right-1 top-1" />
            </div>
          </Card>
        </div>

        <Card titulo="Estados de carga">
          <div className="space-y-2.5">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16 w-2/3" />
          </div>
        </Card>

        <Card titulo="Estado vacío">
          <EstadoVacio
            icono={Inbox}
            titulo="Aún no hay citas"
            descripcion="Cuando un cliente agende una visita aparecerá aquí al instante."
            accion={<Button variante="secundario" tamano="sm">Ver propiedades</Button>}
          />
        </Card>

        <Card titulo="Botones, campos y estados">
          <div className="flex flex-wrap gap-2.5">
            <Button>Agendar visita</Button>
            <Button variante="secundario">Cancelar</Button>
            <Button variante="peligro" icono={Trash2} onClick={() => setConfirmar(true)}>
              Eliminar
            </Button>
            <Button cargando>Guardando</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="etiqueta" htmlFor="demo-nombre">Nombre comercial</label>
              <input id="demo-nombre" className="campo" placeholder="Casa Jardines de Cumbayá" />
            </div>
            <div>
              <label className="etiqueta" htmlFor="demo-estado">Estado</label>
              <select id="demo-estado" className="campo">
                <option>Disponible</option>
                <option>Reservada</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['pendiente', 'enviado', 'fallido', 'disponible', 'reservada', 'vendida', 'descartado'].map((e) => (
              <PildoraEstado key={e} estado={e} />
            ))}
          </div>
        </Card>
      </div>

      <Modal
        abierto={modal}
        onCerrar={() => setModal(false)}
        titulo="Modal de vidrio"
        pie={
          <>
            <Button variante="secundario" onClick={() => setModal(false)}>Cerrar</Button>
            <Button onClick={() => { setModal(false); toast.info('Nueva cita agendada', 'Carlos Paredes · mañana 10:00'); }}>Aceptar</Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          En escritorio se muestra centrado; en móvil sube como hoja inferior. Se cierra con Escape o tocando fuera.
        </p>
      </Modal>

      <ModalConfirmar
        abierto={confirmar}
        onCerrar={() => setConfirmar(false)}
        onConfirmar={() => { setConfirmar(false); toast.error('No se pudo eliminar', 'La propiedad tiene clientes interesados.'); }}
        titulo="¿Eliminar esta propiedad?"
        mensaje="Se borrarán también sus fotos y avalúos. Esta acción no se puede deshacer."
      />
    </>
  );
}
