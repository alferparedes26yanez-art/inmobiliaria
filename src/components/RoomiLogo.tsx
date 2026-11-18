import { cn } from '../lib/utilidades';

/** Las dos "O" unidas del logo de ROOMI (contorno tipo infinito). */
export function MarcaOO({ className, grosor = 4.8 }: { className?: string; grosor?: number }) {
  return (
    <svg viewBox="0 0 100 40" className={className} fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinejoin="round" aria-hidden="true">
      <path d="M20 3C30 3 38 10 50 10C62 10 70 3 80 3A17 17 0 0 1 80 37C70 37 62 30 50 30C38 30 30 37 20 37A17 17 0 0 1 20 3Z" />
    </svg>
  );
}

/**
 * Logo de ROOMI: "R", las dos "O" unidas, "MI" y la sonrisa naranja debajo.
 * El tamaño se controla con el font-size (por ejemplo text-3xl).
 */
export function RoomiLogo({ className, sonrisa = true, tm = true }: { className?: string; sonrisa?: boolean; tm?: boolean }) {
  return (
    <span role="img" aria-label="ROOMI" className={cn('inline-flex select-none items-start font-medium leading-none text-[#F2E8E1]', sonrisa && 'pb-[0.34em]', className)}>
      <span aria-hidden="true" className="flex items-center tracking-[0.02em]">
        <span>R</span>
        <span className="relative mx-[0.03em] inline-flex">
          <MarcaOO className="h-[0.72em] w-auto" />
          {sonrisa && (
            <svg viewBox="0 0 100 18" className="absolute left-[4%] top-full mt-[0.14em] w-[92%] overflow-visible" fill="none" aria-hidden="true">
              <path d="M3 3Q50 30 97 3" stroke="#FF6A1A" strokeWidth="5" strokeLinecap="round" />
            </svg>
          )}
        </span>
        <span>MI</span>
      </span>
      {tm && (
        <span aria-hidden="true" className="ml-[0.08em] mt-[0.02em] hidden text-[0.18em] font-medium tracking-wide sm:inline">
          TM
        </span>
      )}
    </span>
  );
}
