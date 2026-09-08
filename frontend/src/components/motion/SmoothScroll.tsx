'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Scroll suave (Lenis) para la tienda + integración con GSAP ScrollTrigger,
 * para que todos los efectos por scroll compartan el mismo motor y se sientan
 * fluidos (nada de saltos). Se desactiva en /admin.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const enabled = !pathname?.startsWith('/admin');

  useEffect(() => {
    if (!enabled) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic — arranque y frenado suaves
      touchMultiplier: 1.5,
      lerp: 0.1,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [enabled]);

  // Recalcular triggers cuando cambia la ruta (nuevo contenido montado).
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}
