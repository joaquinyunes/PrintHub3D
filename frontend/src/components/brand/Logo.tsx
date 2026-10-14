import Link from 'next/link';

/** Marca: cubo isométrico hecho de capas (el cubo es la pieza, las capas son la impresión). */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g stroke="#0d0e0f" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M10 18 L32 30 L32 58 L10 46 Z" fill="#d7dbe0" />
        <path d="M54 18 L32 30 L32 58 L54 46 Z" fill="#9aa1a8" />
        <path d="M32 6 L54 18 L32 30 L10 18 Z" fill="#ffd21f" />
      </g>
      <g stroke="#0d0e0f" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M10 27.3 L32 39.3 M10 36.7 L32 48.7" />
        <path d="M54 27.3 L32 39.3 M54 36.7 L32 48.7" />
      </g>
      <path d="M20 15.5 L31 9.8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".75" fill="none" />
    </svg>
  );
}

export default function Logo({ href = '/', invert = false }: { href?: string; invert?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Global 3D — inicio">
      <LogoMark className="h-9 w-9 drop-shadow-[2px_2px_0_#0d0e0f]" />
      <span
        className={`font-display text-xl uppercase leading-none ${invert ? 'text-paper' : 'text-ink'}`}
      >
        Global
        <span className="ml-1 rounded-sm border-2 border-ink bg-signal px-1.5 py-0.5 text-ink">3D</span>
      </span>
    </Link>
  );
}
