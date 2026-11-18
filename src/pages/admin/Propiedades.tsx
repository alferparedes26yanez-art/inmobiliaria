import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, ImageOff, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { Button, Card, EstadoVacio, IconButton, PildoraEstado, Skeleton } from '../../components/ui/basicos';
import { ModalConfirmar } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { exigir, mensajeError, useConsulta } from '../../lib/datos';
import { BUCKET_FOTOS, supabase, urlFoto } from '../../lib/supabase';
import { numero, usd } from '../../lib/utilidades';

const ESTADOS = ['disponible', 'reservada', 'vendida', 'inactiva'];

async function cargarPropiedades() {
  return exigir(
    await supabase
      .from('propiedad')
      .select('*, tipo_propiedad(nombre), sector(nombre, ciudad), foto(url, es_principal, orden)')
      .order('fecha_registro', { ascending: false }),
  );
}
type PropiedadLista = Awaited<ReturnType<typeof cargarPropiedades>>[number];

function fotoPrincipal(p: PropiedadLista): string | null {
  const fotos = [...p.foto].sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || a.orden - b.orden);
  return urlFoto(fotos[0]?.url);
}

export default function Propiedades() {
  const navegar = useNavigate();
  const toast = useToast();
  const lista = useConsulta(cargarPropiedades, []);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [sector, setSector] = useState('');
  const [estado, setEstado] = useState('');
  const [aEliminar, setAEliminar] = useState<PropiedadLista | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const tipos = useMemo(() => [...new Set((lista.datos ?? []).map((p) => p.tipo_propiedad.nombre))].sort(), [lista.datos]);
  const sectores = useMemo(
    () => [...new Set((lista.datos ?? []).map((p) => `${p.sector.nombre}, ${p.sector.ciudad}`))].sort(),
    [lista.datos],
  );

  const filtradas = (lista.datos ?? []).filter((p) => {
    const texto = `${p.nombre_comercial} ${p.direccion} ${p.sector.nombre} ${p.sector.ciudad}`.toLowerCase();
    return (
      (!busqueda || texto.includes(busqueda.trim().toLowerCase())) &&
      (!tipo || p.tipo_propiedad.nombre === tipo) &&
      (!sector || `${p.sector.nombre}, ${p.sector.ciudad}` === sector) &&
      (!estado || p.estado === estado)
    );
  });

  const eliminar = async () => {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      // Primero la fila (si falla por dependencias no se pierden las fotos) y luego los archivos.
      const { data: fotos } = await supabase.from('foto').select('url').eq('cod_propiedad', aEliminar.cod_propiedad);
      exigir(await supabase.from('propiedad').delete().eq('cod_propiedad', aEliminar.cod_propiedad).select('cod_propiedad'));
      const rutas = (fotos ?? []).map((f) => f.url).filter((u) => !/^https?:\/\//i.test(u));
      if (rutas.length) await supabase.storage.from(BUCKET_FOTOS).remove(rutas);
      toast.exito('Propiedad eliminada', aEliminar.nombre_comercial);
      setAEliminar(null);
      lista.recargar();
    } catch (e) {
      const err = e as { code?: string };
      toast.error(
        'No se pudo eliminar',
        err.code === '23503' ? 'Tiene clientes interesados. Cámbiala a estado "inactiva" en lugar de borrarla.' : mensajeError(e),
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Propiedades"
        descripcion={lista.datos ? `${numero(filtradas.length)} de ${numero(lista.datos.length)} propiedades` : 'Casas, terrenos, departamentos y suites'}
        acciones={
          <Link to="/admin/propiedades/nueva">
            <Button icono={Plus}>Nueva propiedad</Button>
          </Link>
        }
      />

      {/* Filtros */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="campo pl-11" placeholder="Buscar por nombre o dirección" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <select className="campo" aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className="campo" aria-label="Filtrar por sector" value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">Todos los sectores</option>
          {sectores.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="campo" aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {lista.error ? (
        <Card>
          <EstadoVacio icono={AlertCircle} titulo="No se pudieron cargar las propiedades" descripcion={lista.error} accion={<Button variante="secundario" onClick={lista.recargar}>Reintentar</Button>} />
        </Card>
      ) : !lista.datos ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[330px] rounded-3xl" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <EstadoVacio
            icono={Building2}
            titulo={lista.datos.length === 0 ? 'Aún no hay propiedades' : 'Ninguna propiedad coincide con los filtros'}
            descripcion={lista.datos.length === 0 ? 'Registra la primera para que aparezca en el mapa público.' : 'Prueba con otros filtros o borra la búsqueda.'}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtradas.map((p) => {
            const foto = fotoPrincipal(p);
            return (
              <article key={p.cod_propiedad} className="card group flex flex-col overflow-hidden transition hover:border-white/15">
                <button type="button" onClick={() => navegar(`/admin/propiedades/${p.cod_propiedad}`)} className="relative block aspect-[16/10] w-full overflow-hidden bg-surface-2">
                  {foto ? (
                    <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted">
                      <ImageOff className="h-7 w-7" />
                    </span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    {p.tipo_propiedad.nombre}
                  </span>
                  <PildoraEstado estado={p.estado} className="absolute right-3 top-3 bg-black/55 backdrop-blur" />
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="truncate text-base font-medium text-text" title={p.nombre_comercial}>
                    {p.nombre_comercial}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {p.sector.nombre}, {p.sector.ciudad}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[26px] font-light leading-none text-text">{usd(p.precio_usd)}</p>
                      <p className="mt-1.5 text-xs text-muted">
                        {[p.area_terreno_m2 && `${numero(p.area_terreno_m2)} m² terreno`, p.area_construccion_m2 && `${numero(p.area_construccion_m2)} m² constr.`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <IconButton icono={Pencil} etiqueta="Editar" tamano="sm" onClick={() => navegar(`/admin/propiedades/${p.cod_propiedad}`)} />
                      <IconButton icono={Trash2} etiqueta="Eliminar" tamano="sm" className="hover:!bg-danger/20 hover:!text-danger" onClick={() => setAEliminar(p)} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ModalConfirmar
        abierto={aEliminar !== null}
        onCerrar={() => !eliminando && setAEliminar(null)}
        onConfirmar={eliminar}
        cargando={eliminando}
        titulo="¿Eliminar esta propiedad?"
        mensaje={
          <>
            Se borrará <span className="text-text">{aEliminar?.nombre_comercial}</span> junto con sus fotos, servicios y avalúos. Esta acción no se puede deshacer.
          </>
        }
      />
    </>
  );
}
