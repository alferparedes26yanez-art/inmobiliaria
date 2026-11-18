import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Droplets, ImagePlus, Plus, Save, Waves, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GestorFotos } from '../../components/GestorFotos';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { MapaSelector } from '../../components/MapaSelector';
import { Button, Card, EstadoVacio, PildoraEstado, Segmentado, Skeleton } from '../../components/ui/basicos';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { exigir, mensajeError, useConsulta } from '../../lib/datos';
import { supabase } from '../../lib/supabase';
import { fechaLocal, hoyEcuador, usd } from '../../lib/utilidades';

type EstadoServicio = 'tiene' | 'factible' | 'no_factible';

interface Formulario {
  nombre_comercial: string;
  cod_tipo: string;
  cod_sector: string;
  direccion: string;
  latitud: string;
  longitud: string;
  area_terreno_m2: string;
  area_construccion_m2: string;
  precio_usd: string;
  descripcion: string;
  estado: string;
}

const VACIO: Formulario = {
  nombre_comercial: '',
  cod_tipo: '',
  cod_sector: '',
  direccion: '',
  latitud: '',
  longitud: '',
  area_terreno_m2: '',
  area_construccion_m2: '',
  precio_usd: '',
  descripcion: '',
  estado: 'disponible',
};

const ICONO_SERVICIO: Record<string, LucideIcon> = { Luz: Zap, 'Agua potable': Droplets, Alcantarillado: Waves };
const NIVELES = ['básico', 'estándar', 'lujo'];
const num = (v: string) => Number(v.replace(',', '.'));
const esNumero = (v: string) => v.trim() !== '' && Number.isFinite(num(v));

function Campo({ etiqueta, error, children, ayuda }: { etiqueta: string; error?: string; ayuda?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="etiqueta">{etiqueta}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : ayuda && <span className="mt-1 block text-xs text-muted">{ayuda}</span>}
    </label>
  );
}

export default function PropiedadForm() {
  const { id } = useParams();
  const cod = id ? Number(id) : null;
  const navegar = useNavigate();
  const toast = useToast();

  const catalogos = useConsulta(async () => {
    const [tipos, sectores, servicios] = await Promise.all([
      supabase.from('tipo_propiedad').select('*').order('cod_tipo'),
      supabase.from('sector').select('*').order('ciudad').order('nombre'),
      supabase.from('servicio_basico').select('*').order('cod_servicio'),
    ]);
    return { tipos: exigir(tipos), sectores: exigir(sectores), servicios: exigir(servicios) };
  }, []);

  const detalle = useConsulta(async () => {
    if (cod == null) return null;
    const [propiedad, servicios, avaluos] = await Promise.all([
      supabase.from('propiedad').select('*').eq('cod_propiedad', cod).maybeSingle(),
      supabase.from('propiedad_servicio').select('*').eq('cod_propiedad', cod),
      supabase.from('avaluo').select('*').eq('cod_propiedad', cod).order('fecha_avaluo', { ascending: false }).order('cod_avaluo', { ascending: false }),
    ]);
    return { propiedad: exigir(propiedad), servicios: exigir(servicios), avaluos: exigir(avaluos) };
  }, [cod]);

  const [form, setForm] = useState<Formulario>(VACIO);
  const [servicios, setServicios] = useState<Record<number, EstadoServicio>>({});
  const [avaluo, setAvaluo] = useState({ fecha: hoyEcuador(), valor: '', nivel: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [modalSector, setModalSector] = useState(false);
  const [nuevoSector, setNuevoSector] = useState({ nombre: '', ciudad: '' });
  const [creandoSector, setCreandoSector] = useState(false);

  // Carga los datos existentes en el formulario (solo cuando cambia la propiedad cargada).
  useEffect(() => {
    const p = detalle.datos?.propiedad;
    if (!p) return;
    setForm({
      nombre_comercial: p.nombre_comercial,
      cod_tipo: String(p.cod_tipo),
      cod_sector: String(p.cod_sector),
      direccion: p.direccion,
      latitud: String(p.latitud),
      longitud: String(p.longitud),
      area_terreno_m2: p.area_terreno_m2 == null ? '' : String(p.area_terreno_m2),
      area_construccion_m2: p.area_construccion_m2 == null ? '' : String(p.area_construccion_m2),
      precio_usd: String(p.precio_usd),
      descripcion: p.descripcion ?? '',
      estado: p.estado,
    });
    setServicios(Object.fromEntries((detalle.datos?.servicios ?? []).map((s) => [s.cod_servicio, s.estado_servicio as EstadoServicio])));
  }, [detalle.datos?.propiedad?.cod_propiedad]); // eslint-disable-line react-hooks/exhaustive-deps

  const tipoNombre = catalogos.datos?.tipos.find((t) => String(t.cod_tipo) === form.cod_tipo)?.nombre ?? '';
  const esTerreno = tipoNombre === 'Terreno';
  const sinTerrenoPropio = tipoNombre === 'Departamento' || tipoNombre === 'Suite';
  const cambiar = (campo: keyof Formulario) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const validar = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (form.nombre_comercial.trim().length < 3) e.nombre_comercial = 'Escribe un nombre de al menos 3 caracteres.';
    if (!form.cod_tipo) e.cod_tipo = 'Elige el tipo de propiedad.';
    if (!form.cod_sector) e.cod_sector = 'Elige el sector.';
    if (form.direccion.trim().length < 5) e.direccion = 'Escribe la dirección.';
    if (!esNumero(form.latitud) || Math.abs(num(form.latitud)) > 90 || !esNumero(form.longitud) || Math.abs(num(form.longitud)) > 180)
      e.ubicacion = 'Haz clic en el mapa para fijar la ubicación.';
    if (!esNumero(form.precio_usd) || num(form.precio_usd) < 0) e.precio_usd = 'El precio debe ser un número mayor o igual a 0.';
    if (form.area_terreno_m2.trim() ? !esNumero(form.area_terreno_m2) || num(form.area_terreno_m2) <= 0 : !sinTerrenoPropio)
      e.area_terreno_m2 = 'El área de terreno debe ser mayor a 0.';
    if (!esTerreno && (form.area_construccion_m2.trim() ? !esNumero(form.area_construccion_m2) || num(form.area_construccion_m2) <= 0 : true))
      e.area_construccion_m2 = 'El área de construcción debe ser mayor a 0.';
    if (avaluo.valor.trim()) {
      if (!esNumero(avaluo.valor) || num(avaluo.valor) < 0) e.avaluo_valor = 'El valor del avalúo debe ser un número mayor o igual a 0.';
      if (!avaluo.fecha) e.avaluo_fecha = 'Indica la fecha del avalúo.';
      if (!esTerreno && !avaluo.nivel) e.avaluo_nivel = 'Elige el nivel de acabados.';
    }
    return e;
  };

  const guardar = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length) {
      toast.error('Revisa el formulario', 'Hay campos incompletos o con valores inválidos.');
      return;
    }
    setGuardando(true);
    const { data, error } = await supabase.rpc('guardar_propiedad', {
      p_cod_propiedad: cod as number, // null = crear
      p_datos: {
        ...form,
        latitud: num(form.latitud),
        longitud: num(form.longitud),
        precio_usd: num(form.precio_usd),
        area_terreno_m2: form.area_terreno_m2.trim() ? String(num(form.area_terreno_m2)) : '',
        area_construccion_m2: esTerreno || !form.area_construccion_m2.trim() ? '' : String(num(form.area_construccion_m2)),
      },
      p_servicios: (catalogos.datos?.servicios ?? []).map((s) => ({ cod_servicio: s.cod_servicio, estado_servicio: servicios[s.cod_servicio] ?? 'no_factible' })),
      p_avaluo: avaluo.valor.trim() ? { fecha_avaluo: avaluo.fecha, valor_avaluo_usd: num(avaluo.valor), nivel_acabados: esTerreno ? '' : avaluo.nivel } : undefined,
    });
    setGuardando(false);
    if (error) {
      toast.error('No se pudo guardar la propiedad', mensajeError(error));
      return;
    }
    setAvaluo({ fecha: hoyEcuador(), valor: '', nivel: '' });
    if (cod == null) {
      toast.exito('Propiedad creada', 'Ahora puedes subir sus fotos.');
      navegar(`/admin/propiedades/${data}`, { replace: true });
    } else {
      toast.exito('Cambios guardados');
      detalle.recargar();
    }
  };

  const crearSector = async () => {
    if (nuevoSector.nombre.trim().length < 2 || nuevoSector.ciudad.trim().length < 2) {
      toast.error('Completa el sector', 'Escribe el nombre del sector y la ciudad.');
      return;
    }
    setCreandoSector(true);
    const { data, error } = await supabase
      .from('sector')
      .insert({ nombre: nuevoSector.nombre.trim(), ciudad: nuevoSector.ciudad.trim() })
      .select()
      .single();
    setCreandoSector(false);
    if (error) {
      toast.error('No se pudo crear el sector', error.code === '23505' ? 'Ese sector ya existe en esa ciudad.' : mensajeError(error));
      return;
    }
    catalogos.recargar();
    setForm((f) => ({ ...f, cod_sector: String(data.cod_sector) }));
    setNuevoSector({ nombre: '', ciudad: '' });
    setModalSector(false);
  };

  const volver = (
    <Link to="/admin/propiedades">
      <Button variante="secundario" icono={ArrowLeft}>
        Volver
      </Button>
    </Link>
  );

  if (catalogos.error || detalle.error || (cod != null && detalle.datos && !detalle.datos.propiedad)) {
    return (
      <>
        <EncabezadoPagina titulo="Propiedad" acciones={volver} />
        <Card>
          <EstadoVacio icono={AlertCircle} titulo="No se pudo abrir la propiedad" descripcion={catalogos.error ?? detalle.error ?? 'La propiedad no existe o fue eliminada.'} />
        </Card>
      </>
    );
  }

  if (!catalogos.datos || (cod != null && !detalle.datos)) {
    return (
      <>
        <EncabezadoPagina titulo={cod == null ? 'Nueva propiedad' : 'Editar propiedad'} acciones={volver} />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </>
    );
  }

  const { tipos, sectores, servicios: listaServicios } = catalogos.datos;
  const avaluos = detalle.datos?.avaluos ?? [];

  return (
    <form onSubmit={guardar} noValidate>
      <EncabezadoPagina
        titulo={cod == null ? 'Nueva propiedad' : 'Editar propiedad'}
        descripcion={cod == null ? 'Completa los datos; las fotos se suben después de guardar.' : form.nombre_comercial}
        acciones={
          <>
            {volver}
            <Button type="submit" icono={Save} cargando={guardando}>
              {cod == null ? 'Crear propiedad' : 'Guardar cambios'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card titulo="Datos generales">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Campo etiqueta="Nombre comercial" error={errores.nombre_comercial}>
                <input className="campo" maxLength={120} value={form.nombre_comercial} onChange={cambiar('nombre_comercial')} placeholder="Casa Jardines de Cumbayá" />
              </Campo>
            </div>
            <Campo etiqueta="Tipo" error={errores.cod_tipo}>
              <select className="campo" value={form.cod_tipo} onChange={cambiar('cod_tipo')}>
                <option value="">Selecciona…</option>
                {tipos.map((t) => (
                  <option key={t.cod_tipo} value={t.cod_tipo}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Estado">
              <select className="campo" value={form.estado} onChange={cambiar('estado')}>
                {['disponible', 'reservada', 'vendida', 'inactiva'].map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Precio (USD)" error={errores.precio_usd}>
              <input className="campo" inputMode="decimal" value={form.precio_usd} onChange={cambiar('precio_usd')} placeholder="125000" />
            </Campo>
            <div>
              <Campo etiqueta="Sector" error={errores.cod_sector}>
                <select className="campo" value={form.cod_sector} onChange={cambiar('cod_sector')}>
                  <option value="">Selecciona…</option>
                  {sectores.map((s) => (
                    <option key={s.cod_sector} value={s.cod_sector}>
                      {s.nombre}, {s.ciudad}
                    </option>
                  ))}
                </select>
              </Campo>
              <button type="button" onClick={() => setModalSector(true)} className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary transition hover:brightness-125">
                <Plus className="h-3.5 w-3.5" /> Agregar sector
              </button>
            </div>
            <div className="sm:col-span-2">
              <Campo etiqueta="Descripción (opcional)">
                <textarea className="campo" rows={4} value={form.descripcion} onChange={cambiar('descripcion')} placeholder="Distribución, acabados, entorno…" />
              </Campo>
            </div>
          </div>
        </Card>

        <Card titulo="Ubicación" subtitulo="Haz clic en el mapa para fijar el punto exacto">
          <Campo etiqueta="Dirección" error={errores.direccion}>
            <input className="campo" maxLength={200} value={form.direccion} onChange={cambiar('direccion')} placeholder="Av. Principal y calle secundaria" />
          </Campo>
          <div className="mt-4">
            <MapaSelector
              latitud={esNumero(form.latitud) ? num(form.latitud) : null}
              longitud={esNumero(form.longitud) ? num(form.longitud) : null}
              onCambio={(lat, lng) => setForm((f) => ({ ...f, latitud: String(lat), longitud: String(lng) }))}
            />
          </div>
          {errores.ubicacion && <p className="mt-2 text-xs text-danger">{errores.ubicacion}</p>}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Campo etiqueta="Latitud">
              <input className="campo" inputMode="decimal" value={form.latitud} onChange={cambiar('latitud')} placeholder="-0.180653" />
            </Campo>
            <Campo etiqueta="Longitud">
              <input className="campo" inputMode="decimal" value={form.longitud} onChange={cambiar('longitud')} placeholder="-78.467834" />
            </Campo>
          </div>
        </Card>

        <Card titulo="Áreas y servicios básicos">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo etiqueta="Área de terreno (m²)" error={errores.area_terreno_m2} ayuda={sinTerrenoPropio ? 'Opcional en departamentos y suites.' : undefined}>
              <input className="campo" inputMode="decimal" value={form.area_terreno_m2} onChange={cambiar('area_terreno_m2')} placeholder="300" />
            </Campo>
            <Campo etiqueta="Área de construcción (m²)" error={errores.area_construccion_m2} ayuda={esTerreno ? 'No aplica en terrenos.' : undefined}>
              <input
                className="campo"
                inputMode="decimal"
                disabled={esTerreno}
                value={esTerreno ? '' : form.area_construccion_m2}
                onChange={cambiar('area_construccion_m2')}
                placeholder="180"
              />
            </Campo>
          </div>
          <div className="mt-5 space-y-2.5">
            {listaServicios.map((s) => {
              const Icono = ICONO_SERVICIO[s.nombre] ?? Zap;
              return (
                <div key={s.cod_servicio} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2/70 p-3">
                  <span className="flex items-center gap-3 text-sm text-text">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-primary">
                      <Icono className="h-4 w-4" />
                    </span>
                    {s.nombre}
                  </span>
                  <Segmentado<EstadoServicio>
                    valor={servicios[s.cod_servicio] ?? 'no_factible'}
                    onCambio={(v) => setServicios((x) => ({ ...x, [s.cod_servicio]: v }))}
                    opciones={[
                      { valor: 'tiene', texto: 'Tiene' },
                      { valor: 'factible', texto: 'Factible' },
                      { valor: 'no_factible', texto: 'No factible' },
                    ]}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card titulo="Avalúo" subtitulo="Registra un nuevo avalúo (opcional); el historial se conserva">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Campo etiqueta="Fecha" error={errores.avaluo_fecha}>
              <input type="date" className="campo" max={hoyEcuador()} value={avaluo.fecha} onChange={(e) => setAvaluo((a) => ({ ...a, fecha: e.target.value }))} />
            </Campo>
            <Campo etiqueta="Valor (USD)" error={errores.avaluo_valor}>
              <input className="campo" inputMode="decimal" value={avaluo.valor} onChange={(e) => setAvaluo((a) => ({ ...a, valor: e.target.value }))} placeholder="118000" />
            </Campo>
            <Campo etiqueta="Nivel de acabados" error={errores.avaluo_nivel} ayuda={esTerreno ? 'No aplica en terrenos.' : undefined}>
              <select className="campo" disabled={esTerreno} value={esTerreno ? '' : avaluo.nivel} onChange={(e) => setAvaluo((a) => ({ ...a, nivel: e.target.value }))}>
                <option value="">Selecciona…</option>
                {NIVELES.map((n) => (
                  <option key={n} value={n}>
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <p className="mb-2 mt-6 text-[13px] text-muted">Historial de avalúos</p>
          {avaluos.length === 0 ? (
            <p className="rounded-2xl bg-surface-2/60 px-4 py-5 text-center text-[13px] text-muted">Esta propiedad aún no tiene avalúos registrados.</p>
          ) : (
            <div className="space-y-2">
              {avaluos.map((a, i) => (
                <div key={a.cod_avaluo} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2/70 px-4 py-3">
                  <div>
                    <p className="text-sm text-text">{fechaLocal(a.fecha_avaluo).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-xs text-muted">{a.nivel_acabados ? `Acabados: ${a.nivel_acabados}` : 'Sin nivel de acabados'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {i === 0 && <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium text-primary">Vigente</span>}
                    <span className="text-lg font-light text-text">{usd(a.valor_avaluo_usd)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          className="xl:col-span-2"
          titulo="Fotos"
          subtitulo="La foto principal se usa en el marcador del mapa. Arrastra las miniaturas para reordenarlas."
          acciones={cod != null && <PildoraEstado estado={form.estado} />}
        >
          {cod == null ? (
            <EstadoVacio icono={ImagePlus} titulo="Primero crea la propiedad" descripcion="Al guardar podrás subir, ordenar y marcar la foto principal aquí mismo." />
          ) : (
            <GestorFotos codPropiedad={cod} />
          )}
        </Card>
      </div>

      <Modal
        abierto={modalSector}
        onCerrar={() => setModalSector(false)}
        titulo="Agregar sector"
        ancho="sm"
        pie={
          <>
            <Button variante="secundario" onClick={() => setModalSector(false)}>
              Cancelar
            </Button>
            <Button onClick={crearSector} cargando={creandoSector}>
              Agregar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Campo etiqueta="Nombre del sector">
            <input className="campo" maxLength={80} value={nuevoSector.nombre} onChange={(e) => setNuevoSector((s) => ({ ...s, nombre: e.target.value }))} placeholder="La Floresta" />
          </Campo>
          <Campo etiqueta="Ciudad">
            <input className="campo" maxLength={60} value={nuevoSector.ciudad} onChange={(e) => setNuevoSector((s) => ({ ...s, ciudad: e.target.value }))} placeholder="Quito" />
          </Campo>
        </div>
      </Modal>
    </form>
  );
}
