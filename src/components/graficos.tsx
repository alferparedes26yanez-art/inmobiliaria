import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn, numero } from '../lib/utilidades';

export interface Punto {
  etiqueta: string;
  valor: number;
  /** Texto completo para el tooltip (por ejemplo la fecha larga). */
  detalle?: string;
}

const EJE = { fill: '#A3948A', fontSize: 12 };

/* Tooltip blanco en píldora con fecha y valor */
function TooltipPildora({
  active,
  payload,
  unidad,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: Punto }>;
  unidad: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-full bg-white px-4 py-1.5 text-xs text-[#1E1511] shadow-float">
      <span className="text-[#7A6A5F]">{p.payload.detalle ?? p.payload.etiqueta}</span>
      <span className="ml-2 font-semibold">
        {numero(p.value)} {unidad}
      </span>
    </div>
  );
}

/** Gráfico de área: línea naranja con relleno degradado a transparente. */
export function GraficoArea({ datos, unidad = '', alto = 240 }: { datos: Punto[]; unidad?: string; alto?: number }) {
  return (
    <div style={{ height: alto }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="rellenoArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7A2F" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#FF7A2F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="etiqueta" tick={EJE} axisLine={false} tickLine={false} tickMargin={10} minTickGap={18} />
          <YAxis tick={EJE} axisLine={false} tickLine={false} allowDecimals={false} width={48} />
          <Tooltip
            content={<TooltipPildora unidad={unidad} />}
            cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke="#FF7A2F"
            strokeWidth={2.5}
            fill="url(#rellenoArea)"
            activeDot={{ r: 5, fill: '#FF7A2F', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Gráfico de barras: café oscuro, con la última barra (mes actual) en verde con brillo y su valor encima. */
export function GraficoBarras({ datos, alto = 240 }: { datos: Punto[]; alto?: number }) {
  const ultimo = datos.length - 1;

  // Cada barra se dibuja a mano: la última va en verde con brillo y su valor en una píldora encima.
  const barra = (props: unknown) => {
    const { x = 0, y = 0, width = 0, height = 0, index, payload } = props as {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      index?: number;
      payload?: Punto;
    };
    const actual = index === ultimo;
    const radio = Math.min(14, width / 2, height / 2);
    const centro = x + width / 2;
    const texto = String(payload?.valor ?? 0);
    const ancho = 26 + texto.length * 7;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={radio}
          fill={actual ? '#5EE6A8' : '#3A281E'}
          style={actual ? { filter: 'drop-shadow(0 0 14px rgba(94,230,168,0.55))' } : undefined}
        />
        {actual && (
          <>
            <rect x={centro - ancho / 2} y={y - 30} width={ancho} height={22} rx={11} fill="#5EE6A8" />
            <text x={centro} y={y - 15} textAnchor="middle" fontSize={12} fontWeight={600} fill="#0E2A1D">
              {texto}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div style={{ height: alto }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 34, right: 4, left: 4, bottom: 0 }} barCategoryGap="22%">
          <XAxis dataKey="etiqueta" tick={EJE} axisLine={false} tickLine={false} tickMargin={10} />
          <Tooltip content={<TooltipPildora unidad="" />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 14 }} />
          <Bar dataKey="valor" minPointSize={10} shape={barra} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras horizontales gruesas tipo "Market demand". */
export function BarrasHorizontales({ datos }: { datos: Array<{ etiqueta: string; valor: number; color: string }> }) {
  const maximo = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <div className="space-y-3.5">
      {datos.map((d) => (
        <div key={d.etiqueta}>
          <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
            <span className="text-muted">{d.etiqueta}</span>
            <span className="font-medium text-text">{numero(d.valor)}</span>
          </div>
          <div className="h-3.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max(d.valor > 0 ? 6 : 0, (d.valor / maximo) * 100)}%`, background: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Heatmap tipo "Order time tracking": cuadrícula de cuadrados redondeados con intensidad naranja. */
export function Heatmap({
  filas,
  columnas,
  valor,
}: {
  filas: string[];
  columnas: string[];
  /** Devuelve el valor de la celda (fila, columna). */
  valor: (fila: number, columna: number) => number;
}) {
  let maximo = 1;
  filas.forEach((_, f) => columnas.forEach((_, c) => (maximo = Math.max(maximo, valor(f, c)))));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[300px] gap-1.5" style={{ gridTemplateColumns: `2.25rem repeat(${columnas.length}, minmax(0, 1fr))` }}>
        <span />
        {columnas.map((c) => (
          <span key={c} className="pb-1 text-center text-[11px] text-muted">
            {c}
          </span>
        ))}
        {filas.map((fila, f) => (
          <div key={fila} className="contents">
            <span className="self-center text-[11px] text-muted">{fila}</span>
            {columnas.map((col, c) => {
              const v = valor(f, c);
              const intensidad = v === 0 ? 0 : 0.22 + 0.78 * (v / maximo);
              return (
                <div
                  key={col}
                  title={`${fila} ${col}: ${v} ${v === 1 ? 'cita' : 'citas'}`}
                  className={cn('h-7 rounded-lg transition sm:h-8 hover:ring-1 hover:ring-white/30', v === 0 && 'bg-surface-2')}
                  style={v > 0 ? { background: `rgba(255, 122, 47, ${intensidad})` } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
