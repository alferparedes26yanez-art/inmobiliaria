import { useState } from 'react';
import { AlertCircle, ImageOff, Megaphone, Pause, Pencil, Play, Plus, Tag, Trash2 } from 'lucide-react';
import { EncabezadoPagina } from '../../components/layout/AdminLayout';
import { Button, Card, EstadoVacio, IconButton, Pildora, Skeleton } from '../../components/ui/basicos';
import type { Tono } from '../../components/ui/basicos';
import { Modal, ModalConfirmar } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { exigir, mensajeError, useConsulta } from '../../lib/datos';
import { supabase, urlFoto } from '../../lib/supabase';
import { fechaCorta, hoyEcuador, sumarDias, usd } from '../../lib/utilidades';

async function cargarOfertas() {
  return exigir(
    await supabase
      .from('oferta_especial')
      .select('*, propiedad(cod_propiedad, nombre_comercial, precio_usd, estado, foto(url, es_principal, orden))')
      .order('activa', { ascending: false })
      .order('orden')
      .order('fecha_registro', { ascending: false }),
  );
}
type Oferta = Awaited<ReturnType<typeof cargarOfertas>>[number];

interface Formulario {
  titulo: string;
  descripcion: string;
  etiqueta: string;
  cod_propiedad: string;
  precio_oferta_usd: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  orden: string;
}

const nuevo = (): Formulario => ({
  titulo: '',
  descripcion: '',
  etiqueta: 'Oferta especial',
  cod_propiedad: '',
  precio_oferta_usd: '',
  fecha_inicio: hoyEcuador(),
  fecha_fin: sumarDias(hoyEcuador(), 30),
  activa: true,
  orden: '0',
});

/** Qué ve hoy el público de esta oferta. */
function estadoPublico(o: Oferta): { texto: string; tono: Tono } {
  const hoy = hoyEcuador();
  if (!o.activa) return { texto: 'Pausada', tono: 'neutro' };
  if (o.fecha_inicio > hoy) return { texto: `Desde ${fechaCorta(o.fecha_inicio)}`, tono: 'naranja' };
  if (o.fecha_fin && o.fecha_fin < hoy) return { texto: 'Vencida', tono: 'rojo' };
  if (o.propiedad && o.propiedad.estado !== 'disponible') return { texto: `No visible: propiedad ${o.propiedad.estado}`, tono: 'rojo' };
  return { texto: 'Publicada', tono: 'verde' };
}

function fotoDe(o: Oferta): string | null {
  const fotos = [...(o.propiedad?.foto ?? [])].sort((a, b) => Number(b.es_principal) - Number(a.es_principal) || a.orden - b.orden);
  return urlFoto(fotos[0]?.url);
}

export default function Ofertas() {
  const toast = useToast();
  const ofertas = useConsulta(cargarOfertas, []);
  const propiedades = useConsulta(
    async () => exigir(await supabase.from('propiedad').select('cod_propiedad, nombre_comercial, precio_usd, estado').order('nombre_comercial')),
    [],
  );

  const [editando, setEditando] = useState<number | 'nueva' | null>(null);
  const [form, setForm] = useState<Formulario>(nuevo());
  const [errores, setErrores] = useState<Partial<Record<keyof Formulario, string>>>({});
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Oferta | null>(null);
  const [ocupada, setOcupada] = useState<number | null>(null);

  const abrir = (o?: Oferta) => {
    setErrores({});
    if (!o) {
      setForm(nuevo());
      setEditando('nueva');
      return;
    }
    setForm({
      titulo: o.titulo,
      descripcion: o.descripcion ?? '',
      etiqueta: o.etiqueta,
      cod_propiedad: o.cod_propiedad == null ? '' : String(o.cod_propiedad),
      precio_oferta_usd: o.precio_oferta_usd == null ? '' : String(o.precio_oferta_usd),
      fecha_inicio: o.fecha_inicio,
      fecha_fin: o.fecha_fin ?? '',
      activa: o.activa,
      orden: String(o.orden),
    });
    setEditando(o.cod_oferta);
  };

  const cambiar = (campo: keyof Formulario) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const propiedadElegida = propiedades.datos?.find((p) => String(p.cod_propiedad) === form.cod_propiedad);

  const guardar = async () => {
    const e: Partial<Record<keyof Formulario, string>> = {};
    const precio = Number(form.precio_oferta_usd.replace(',', '.'));
    if (form.titulo.trim().length < 3) e.titulo = 'Escribe un título de al menos 3 caracteres.';
    if (form.etiqueta.trim().length < 2) e.etiqueta = 'Escribe la etiqueta (por ejemplo "Oferta especial").';
    if (form.precio_oferta_usd.trim()) {
      if (!form.cod_propiedad) e.precio_oferta_usd = 'Para poner un precio de oferta elige una propiedad.';
      else if (!Number.isFinite(precio) || precio < 0) e.precio_oferta_usd = 'Escribe un precio válido, mayor o igual a 0.';
      else if (propiedadElegida && precio >= propiedadElegida.precio_usd) e.precio_oferta_usd = `Debe ser menor al precio actual (${usd(propiedadElegida.precio_usd)}).`;
    }
    if (!form.fecha_inicio) e.fecha_inicio = 'Indica desde cuándo se muestra.';
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) e.fecha_fin = 'La fecha de fin no puede ser anterior a la de inicio.';
    setErrores(e);
    if (Object.keys(e).length) return;

    const fila = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      etiqueta: form.etiqueta.trim(),
      cod_propiedad: form.cod_propiedad ? Number(form.cod_propiedad) : null,
      precio_oferta_usd: form.precio_oferta_usd.trim() ? precio : null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
      activa: form.activa,
      orden: Math.max(0, Math.round(Number(form.orden) || 0)),
    };
    setGuardando(true);
    const { error } = editando === 'nueva' ? await supabase.from('oferta_especial').insert(fila) : await supabase.from('oferta_especial').update(fila).eq('cod_oferta', editando as number);
    setGuardando(false);
    if (error) {
      toast.error('No se pudo guardar la oferta', mensajeError(error));
      return;
    }
    toast.exito(editando === 'nueva' ? 'Oferta creada' : 'Oferta actualizada', form.activa ? 'Se mostrará en el mapa público mientras esté vigente.' : 'Está pausada: no se muestra al público.');
    setEditando(null);
    ofertas.recargar();
  };

  const alternar = async (o: Oferta) => {
    setOcupada(o.cod_oferta);
    const { error } = await supabase.from('oferta_especial').update({ activa: !o.activa }).eq('cod_oferta', o.cod_oferta);
    setOcupada(null);
    if (error) toast.error('No se pudo cambiar la oferta', mensajeError(error));
    else ofertas.recargar();
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    setOcupada(aEliminar.cod_oferta);
    const { error } = await supabase.from('oferta_especial').delete().eq('cod_oferta', aEliminar.cod_oferta);
    setOcupada(null);
    if (error) {
      toast.error('No se pudo eliminar la oferta', mensajeError(error));
      return;
    }
    toast.exito('Oferta eliminada');
    setAEliminar(null);
    ofertas.recargar();
  };

  const lista = ofertas.datos ?? [];
  const publicadas = lista.filter((o) => estadoPublico(o).texto === 'Publicada').length;

  return (
    <>
      <EncabezadoPagina
        titulo="Ofertas especiales"
        descripcion={ofertas.datos ? `${publicadas} ${publicadas === 1 ? 'oferta publicada' : 'ofertas publicadas'} en el mapa` : 'Promociones que se muestran en el panel público'}
        acciones={
          <Button icono={Plus} onClick={() => abrir()}>
            Nueva oferta
          </Button>
        }
      />

      {ofertas.error ? (
        <Card>
          <EstadoVacio icono={AlertCircle} titulo="No se pudieron cargar las ofertas" descripcion={ofertas.error} accion={<Button variante="secundario" onClick={ofertas.recargar}>Reintentar</Button>} />
        </Card>
      ) : !ofertas.datos ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      ) : lista.length === 0 ? (
        <Card>
          <EstadoVacio
            icono={Megaphone}
            titulo="Aún no hay ofertas"
            descripcion="Crea una oferta para destacar una propiedad con precio rebajado o publicar un anuncio en el mapa."
            accion={<Button icono={Plus} onClick={() => abrir()}>Crear la primera</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((o) => {
            const estado = estadoPublico(o);
            const foto = fotoDe(o);
            return (
              <article key={o.cod_oferta} className="card flex flex-col overflow-hidden">
                <div className="relative aspect-[16/9] bg-surface-2">
                  {foto ? (
                    <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : o.propiedad ? (
                    <span className="flex h-full items-center justify-center text-muted">
                      <ImageOff className="h-7 w-7" />
                    </span>
                  ) : (
                    <span className="flex h-full items-center justify-center bg-promo-grad text-white">
                      <Megaphone className="h-8 w-8" />
                    </span>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary-grad px-3 py-1 text-xs font-medium text-white shadow-primary">
                    <Tag className="h-3 w-3" /> {o.etiqueta}
                  </span>
                  <Pildora tono={estado.tono} className="absolute right-3 top-3 bg-black/60 backdrop-blur">
                    {estado.texto}
                  </Pildora>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-medium text-text">{o.titulo}</h3>
                  {o.descripcion && <p className="mt-1 line-clamp-2 text-[13px] text-muted">{o.descripcion}</p>}
                  <p className="mt-3 truncate text-xs text-muted">{o.propiedad ? o.propiedad.nombre_comercial : 'Anuncio general (sin propiedad)'}</p>
                  {o.propiedad && o.precio_oferta_usd != null && (
                    <p className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-light text-text">{usd(o.precio_oferta_usd)}</span>
                      <span className="text-sm text-muted line-through">{usd(o.propiedad.precio_usd)}</span>
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <span className="text-xs text-muted">
                      {fechaCorta(o.fecha_inicio)} – {o.fecha_fin ? fechaCorta(o.fecha_fin) : 'sin fin'}
                    </span>
                    <div className="flex gap-2">
                      <IconButton icono={o.activa ? Pause : Play} etiqueta={o.activa ? 'Pausar' : 'Activar'} tamano="sm" disabled={ocupada === o.cod_oferta} onClick={() => alternar(o)} />
                      <IconButton icono={Pencil} etiqueta="Editar" tamano="sm" onClick={() => abrir(o)} />
                      <IconButton icono={Trash2} etiqueta="Eliminar" tamano="sm" className="hover:!bg-danger/20 hover:!text-danger" onClick={() => setAEliminar(o)} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        abierto={editando !== null}
        onCerrar={() => !guardando && setEditando(null)}
        titulo={editando === 'nueva' ? 'Nueva oferta' : 'Editar oferta'}
        ancho="md"
        pie={
          <>
            <Button variante="secundario" onClick={() => setEditando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} cargando={guardando}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="etiqueta">Título</span>
            <input className="campo" maxLength={80} placeholder="Rebaja en Casa Hacienda Caranqui" value={form.titulo} onChange={cambiar('titulo')} />
            {errores.titulo && <span className="mt-1 block text-xs text-danger">{errores.titulo}</span>}
          </label>
          <label className="block sm:col-span-2">
            <span className="etiqueta">Descripción (opcional)</span>
            <textarea className="campo" rows={3} maxLength={300} placeholder="Por qué vale la pena y hasta cuándo dura." value={form.descripcion} onChange={cambiar('descripcion')} />
          </label>
          <label className="block">
            <span className="etiqueta">Etiqueta</span>
            <input className="campo" maxLength={30} placeholder="Oferta especial" value={form.etiqueta} onChange={cambiar('etiqueta')} />
            {errores.etiqueta && <span className="mt-1 block text-xs text-danger">{errores.etiqueta}</span>}
          </label>
          <label className="block">
            <span className="etiqueta">Orden (0 = primera)</span>
            <input className="campo" inputMode="numeric" value={form.orden} onChange={cambiar('orden')} />
          </label>
          <label className="block sm:col-span-2">
            <span className="etiqueta">Propiedad (opcional)</span>
            <select className="campo" value={form.cod_propiedad} onChange={(e) => setForm((f) => ({ ...f, cod_propiedad: e.target.value, precio_oferta_usd: e.target.value ? f.precio_oferta_usd : '' }))}>
              <option value="">Ninguna: anuncio general</option>
              {(propiedades.datos ?? []).map((p) => (
                <option key={p.cod_propiedad} value={p.cod_propiedad}>
                  {p.nombre_comercial} · {usd(p.precio_usd)}
                  {p.estado !== 'disponible' ? ` (${p.estado})` : ''}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted">Con propiedad se usa su foto y el botón lleva a su ficha. Solo se muestra si la propiedad está disponible.</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="etiqueta">Precio de oferta en USD (opcional)</span>
            <input
              className="campo"
              inputMode="decimal"
              disabled={!form.cod_propiedad}
              placeholder={propiedadElegida ? `Menor a ${usd(propiedadElegida.precio_usd)}` : 'Elige primero una propiedad'}
              value={form.precio_oferta_usd}
              onChange={cambiar('precio_oferta_usd')}
            />
            {errores.precio_oferta_usd && <span className="mt-1 block text-xs text-danger">{errores.precio_oferta_usd}</span>}
          </label>
          <label className="block">
            <span className="etiqueta">Se muestra desde</span>
            <input type="date" className="campo" value={form.fecha_inicio} onChange={cambiar('fecha_inicio')} />
            {errores.fecha_inicio && <span className="mt-1 block text-xs text-danger">{errores.fecha_inicio}</span>}
          </label>
          <label className="block">
            <span className="etiqueta">Hasta (vacío = sin fin)</span>
            <input type="date" className="campo" min={form.fecha_inicio} value={form.fecha_fin} onChange={cambiar('fecha_fin')} />
            {errores.fecha_fin && <span className="mt-1 block text-xs text-danger">{errores.fecha_fin}</span>}
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-2/70 px-4 py-3 sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-[#FF7A2F]" checked={form.activa} onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))} />
            <span className="text-sm text-text">Oferta activa (se muestra al público mientras esté vigente)</span>
          </label>
        </div>
      </Modal>

      <ModalConfirmar
        abierto={aEliminar !== null}
        onCerrar={() => ocupada === null && setAEliminar(null)}
        onConfirmar={eliminar}
        cargando={ocupada !== null}
        titulo="¿Eliminar esta oferta?"
        mensaje={
          <>
            Se dejará de mostrar <span className="text-text">{aEliminar?.titulo}</span>. Si solo quieres ocultarla un tiempo, usa "Pausar".
          </>
        }
      />
    </>
  );
}
