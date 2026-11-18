import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { exigir, mensajeError, useConsulta } from '../lib/datos';
import { BUCKET_FOTOS, supabase, urlFoto } from '../lib/supabase';
import type { Tabla } from '../lib/supabase';
import { cn } from '../lib/utilidades';
import { Skeleton } from './ui/basicos';
import { ModalConfirmar } from './ui/Modal';
import { useToast } from './ui/Toast';

type Foto = Tabla<'foto'>;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;
const esExterna = (url: string) => /^https?:\/\//i.test(url);

/** Fotos de una propiedad: subir varias (drag & drop), marcar principal, reordenar y eliminar. */
export function GestorFotos({ codPropiedad }: { codPropiedad: number }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const fotos = useConsulta(
    async () => exigir(await supabase.from('foto').select('*').eq('cod_propiedad', codPropiedad).order('orden').order('cod_foto')),
    [codPropiedad],
  );
  const [subiendo, setSubiendo] = useState<Array<{ id: string; vista: string }>>([]);
  const [encima, setEncima] = useState(false);
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [aEliminar, setAEliminar] = useState<Foto | null>(null);
  const [arrastrada, setArrastrada] = useState<number | null>(null);

  const lista = fotos.datos ?? [];

  const subir = async (archivos: File[]) => {
    const validos = archivos.filter((a) => {
      if (!TIPOS.includes(a.type)) {
        toast.error('Formato no permitido', `${a.name}: usa JPG, PNG o WebP.`);
        return false;
      }
      if (a.size > MAX_MB * 1024 * 1024) {
        toast.error('Archivo muy grande', `${a.name} supera los ${MAX_MB} MB.`);
        return false;
      }
      return true;
    });
    if (!validos.length) return;

    const pendientes = validos.map((a) => ({ id: crypto.randomUUID(), vista: URL.createObjectURL(a), archivo: a }));
    setSubiendo((s) => [...s, ...pendientes.map(({ id, vista }) => ({ id, vista }))]);

    let orden = lista.reduce((m, f) => Math.max(m, f.orden), -1) + 1;
    let hayPrincipal = lista.some((f) => f.es_principal);
    let subidas = 0;

    for (const p of pendientes) {
      const extension = p.archivo.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const ruta = `${codPropiedad}/${p.id}.${extension}`;
      try {
        const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(ruta, p.archivo, { contentType: p.archivo.type, cacheControl: '31536000' });
        if (error) throw error;
        const fila = await supabase.from('foto').insert({ cod_propiedad: codPropiedad, url: ruta, es_principal: !hayPrincipal, orden });
        if (fila.error) {
          await supabase.storage.from(BUCKET_FOTOS).remove([ruta]);
          throw fila.error;
        }
        hayPrincipal = true;
        orden++;
        subidas++;
      } catch (e) {
        toast.error(`No se pudo subir ${p.archivo.name}`, mensajeError(e));
      } finally {
        URL.revokeObjectURL(p.vista);
        setSubiendo((s) => s.filter((x) => x.id !== p.id));
      }
    }
    if (subidas) {
      toast.exito(subidas === 1 ? 'Foto subida' : `${subidas} fotos subidas`);
      fotos.recargar();
    }
  };

  const alSoltar = (e: DragEvent) => {
    e.preventDefault();
    setEncima(false);
    if (e.dataTransfer.files.length) void subir([...e.dataTransfer.files]);
  };

  const marcarPrincipal = async (f: Foto) => {
    setOcupada(f.cod_foto);
    const { error } = await supabase.rpc('marcar_foto_principal', { p_cod_foto: f.cod_foto });
    setOcupada(null);
    if (error) toast.error('No se pudo marcar como principal', mensajeError(error));
    else fotos.recargar();
  };

  /** Mueve la foto de la posición `desde` a `hasta` y guarda el nuevo orden. */
  const mover = async (desde: number, hasta: number) => {
    if (hasta < 0 || hasta >= lista.length || desde === hasta) return;
    const nueva = [...lista];
    const [item] = nueva.splice(desde, 1);
    nueva.splice(hasta, 0, item);
    setOcupada(item.cod_foto);
    const cambios = nueva.map((f, i) => ({ f, i })).filter(({ f, i }) => f.orden !== i);
    const resultados = await Promise.all(cambios.map(({ f, i }) => supabase.from('foto').update({ orden: i }).eq('cod_foto', f.cod_foto)));
    setOcupada(null);
    const fallo = resultados.find((r) => r.error);
    if (fallo?.error) toast.error('No se pudo reordenar', mensajeError(fallo.error));
    fotos.recargar();
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    setOcupada(aEliminar.cod_foto);
    try {
      // Se borra el archivo y su fila; si era la principal, la siguiente pasa a serlo.
      if (!esExterna(aEliminar.url)) {
        const { error } = await supabase.storage.from(BUCKET_FOTOS).remove([aEliminar.url]);
        if (error) throw error;
      }
      exigir(await supabase.from('foto').delete().eq('cod_foto', aEliminar.cod_foto).select('cod_foto'));
      const siguiente = lista.find((f) => f.cod_foto !== aEliminar.cod_foto);
      if (aEliminar.es_principal && siguiente) await supabase.rpc('marcar_foto_principal', { p_cod_foto: siguiente.cod_foto });
      toast.exito('Foto eliminada');
      fotos.recargar();
    } catch (e) {
      toast.error('No se pudo eliminar la foto', mensajeError(e));
    } finally {
      setOcupada(null);
      setAEliminar(null);
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={alSoltar}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-8 text-center transition',
          encima ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface-2/50 hover:border-white/20 hover:bg-surface-2',
        )}
      >
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ImagePlus className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-text">Arrastra tus fotos aquí o haz clic para elegirlas</p>
        <p className="mt-1 text-xs text-muted">JPG, PNG o WebP · hasta {MAX_MB} MB cada una</p>
        <input
          ref={input}
          type="file"
          accept={TIPOS.join(',')}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void subir([...e.target.files]);
            e.target.value = '';
          }}
        />
      </div>

      {fotos.error && <p className="mt-3 text-[13px] text-danger">{fotos.error}</p>}

      {!fotos.datos && !fotos.error ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
        </div>
      ) : (
        (lista.length > 0 || subiendo.length > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {lista.map((f, i) => (
              <div
                key={f.cod_foto}
                draggable
                onDragStart={() => setArrastrada(i)}
                onDragEnd={() => setArrastrada(null)}
                onDragOver={(e) => arrastrada !== null && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (arrastrada !== null) void mover(arrastrada, i);
                  setArrastrada(null);
                }}
                className={cn(
                  'group relative aspect-[4/3] cursor-grab overflow-hidden rounded-2xl border bg-surface-2 transition',
                  f.es_principal ? 'border-primary/70' : 'border-border',
                  arrastrada === i && 'opacity-40',
                )}
              >
                <img src={urlFoto(f.url) ?? ''} alt="" className="h-full w-full object-cover" draggable={false} />
                {f.es_principal && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary-grad px-2.5 py-1 text-[11px] font-medium text-white shadow-primary">
                    <Star className="h-3 w-3 fill-current" /> Principal
                  </span>
                )}
                {ocupada === f.cod_foto && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <div className="flex gap-1">
                    <BotonFoto etiqueta="Mover antes" disabled={i === 0} onClick={() => mover(i, i - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </BotonFoto>
                    <BotonFoto etiqueta="Mover después" disabled={i === lista.length - 1} onClick={() => mover(i, i + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </BotonFoto>
                  </div>
                  <div className="flex gap-1">
                    {!f.es_principal && (
                      <BotonFoto etiqueta="Marcar como principal" onClick={() => marcarPrincipal(f)}>
                        <Star className="h-4 w-4" />
                      </BotonFoto>
                    )}
                    <BotonFoto etiqueta="Eliminar foto" peligro onClick={() => setAEliminar(f)}>
                      <Trash2 className="h-4 w-4" />
                    </BotonFoto>
                  </div>
                </div>
              </div>
            ))}
            {subiendo.map((s) => (
              <div key={s.id} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-2">
                <img src={s.vista} alt="" className="h-full w-full object-cover opacity-50" />
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-xs text-white">
                  <Loader2 className="h-5 w-5 animate-spin" /> Subiendo…
                </span>
              </div>
            ))}
          </div>
        )
      )}

      <ModalConfirmar
        abierto={aEliminar !== null}
        onCerrar={() => ocupada === null && setAEliminar(null)}
        onConfirmar={eliminar}
        cargando={ocupada !== null}
        titulo="¿Eliminar esta foto?"
        mensaje="Se borrará el archivo y dejará de mostrarse en el mapa público."
      />
    </div>
  );
}

function BotonFoto({
  etiqueta,
  peligro,
  children,
  ...rest
}: {
  etiqueta: string;
  peligro?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={etiqueta}
      aria-label={etiqueta}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition disabled:opacity-30',
        peligro ? 'hover:bg-danger' : 'hover:bg-primary',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
