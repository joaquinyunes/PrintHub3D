'use client';

import { useState, type ReactNode } from 'react';
import { Camera, Pencil } from 'lucide-react';

interface Props {
  /** Ilustración (o la imagen principal del producto) */
  src: string;
  /** Foto real que aparece al pasar el mouse / al tocar el botón. Vacío = sin efecto. */
  photo?: string;
  alt: string;
  className?: string;
  /** Si se pasa, toda la imagen es un botón (abre el detalle) */
  onOpen?: () => void;
  /** Etiquetas superpuestas (categoría, "Sin stock") */
  children?: ReactNode;
}

/**
 * Imagen con "revelado": en escritorio la foto real aparece al pasar el mouse; en celular
 * (sin hover) hay un botón chico para alternar entre la ilustración y la foto.
 */
export default function RevealImage({ src, photo, alt, className = '', onOpen, children }: Props) {
  const [real, setReal] = useState(false);
  const drawing = src.endsWith('.svg');

  const media = (
    <>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full ${drawing ? 'object-contain p-5' : 'object-cover'}`}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-xs font-extrabold uppercase tracking-widest text-steel-300">
          Sin imagen
        </span>
      )}
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full bg-paper-2 object-cover transition-opacity duration-300 ${
            real ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </>
  );

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setReal(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setReal(false)}
    >
      {onOpen ? (
        <button type="button" onClick={onOpen} aria-label={`Ver ${alt}`} className="absolute inset-0 block text-left">
          {media}
        </button>
      ) : (
        media
      )}
      {children}
      {photo && (
        <button
          type="button"
          onClick={() => setReal((v) => !v)}
          aria-pressed={real}
          aria-label={real ? 'Ver la ilustración' : 'Ver la foto real'}
          className="absolute bottom-2 right-2 z-10 hidden items-center gap-1 rounded-sm border-2 border-ink bg-white px-2 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider [@media(hover:none)]:inline-flex"
        >
          {real ? <Pencil size={12} strokeWidth={3} /> : <Camera size={12} strokeWidth={3} />}
          {real ? 'Dibujo' : 'Foto real'}
        </button>
      )}
    </div>
  );
}
