import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ChevronRight, Search, UserSearch, Users } from 'lucide-react';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { Avatar, Button, Card, EstadoVacio, PildoraEstado, Segmentado, Skeleton } from '../../components/ui/basicos';
import { exigir, useConsulta } from '../../lib/datos';
import { supabase } from '../../lib/supabase';
import { haceCuanto, numero } from '../../lib/utilidades';

export default function Clientes() {
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const filtro = params.get('filtro') === 'recuperar' ? 'recuperar' : 'todos';
  const [busqueda, setBusqueda] = useState('');

  const clientes = useConsulta(async () => exigir(await supabase.from('v_cliente_cartera').select('*').order('fecha_registro', { ascending: false })), []);
  const todos = clientes.datos ?? [];
  const paraRecuperar = todos.filter((c) => c.para_recuperar).length;

  const texto = busqueda.trim().toLowerCase();
  const filtrados = todos.filter(
    (c) =>
      (filtro === 'todos' || c.para_recuperar) &&
      (!texto || `${c.nombre} ${c.apellido} ${c.cedula} ${c.telefono} ${c.correo}`.toLowerCase().includes(texto)),
  );

  return (
    <>
      <EncabezadoPagina titulo="Clientes" descripcion={clientes.datos ? `${numero(todos.length)} clientes en la cartera` : 'Cartera de clientes registrados'} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[240px] max-w-md flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="campo pl-11" placeholder="Buscar por nombre, cédula, teléfono o correo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <Segmentado
          valor={filtro}
          onCambio={(v) => setParams(v === 'recuperar' ? { filtro: 'recuperar' } : {}, { replace: true })}
          opciones={[
            { valor: 'todos', texto: 'Todos' },
            { valor: 'recuperar', texto: `Clientes para recuperar${clientes.datos ? ` (${paraRecuperar})` : ''}` },
          ]}
        />
      </div>

      <Card className="!p-3 sm:!p-4">
        {clientes.error ? (
          <EstadoVacio icono={AlertCircle} titulo="No se pudieron cargar los clientes" descripcion={clientes.error} accion={<Button variante="secundario" onClick={clientes.recargar}>Reintentar</Button>} />
        ) : !clientes.datos ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[68px]" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <EstadoVacio
            icono={todos.length === 0 ? Users : UserSearch}
            titulo={todos.length === 0 ? 'Aún no hay clientes' : 'Ningún cliente coincide'}
            descripcion={
              todos.length === 0
                ? 'Los clientes se registran solos al agendar una visita desde el mapa.'
                : filtro === 'recuperar'
                  ? 'No hay clientes descartados ni sin contacto en los últimos 30 días.'
                  : 'Prueba con otro nombre, cédula o teléfono.'
            }
          />
        ) : (
          <div className="space-y-2">
            <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_10rem_9rem_1.5rem] gap-4 px-3 pb-1 text-xs text-muted md:grid">
              <span>Cliente</span>
              <span>Propiedad de interés</span>
              <span>Etapa actual</span>
              <span>Último contacto</span>
              <span />
            </div>
            {filtrados.map((c) => (
              <button
                key={c.cedula}
                type="button"
                onClick={() => navegar(`/admin/clientes/${c.cedula}`)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-2xl bg-surface-2/70 p-3 text-left transition hover:bg-surface-3 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_10rem_9rem_1.5rem]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar nombre={c.nombre ?? '?'} apellido={c.apellido ?? ''} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-text">
                      {c.nombre} {c.apellido}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {c.telefono} · {c.correo}
                    </span>
                  </span>
                </span>
                <span className="hidden truncate text-[13px] text-muted md:block">{c.propiedad_actual ?? 'Sin intereses'}</span>
                <span className="justify-self-end md:justify-self-start">{c.etapa_actual ? <PildoraEstado estado={c.etapa_actual} /> : <span className="text-xs text-muted">—</span>}</span>
                <span className={`col-span-2 text-xs md:col-span-1 md:text-[13px] ${c.para_recuperar ? 'text-danger' : 'text-muted'}`}>
                  <span className="md:hidden">Último contacto: </span>
                  {haceCuanto(c.ultimo_contacto)}
                </span>
                <ChevronRight className="hidden h-4 w-4 text-muted md:block" />
              </button>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
