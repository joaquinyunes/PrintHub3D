'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface GsapRevealProps {
  children: React.ReactNode;
  /** Selector de hijos a animar en cascada. Si se omite, anima el contenedor. */
  selector?: string;
  y?: number;
  stagger?: number;
  duration?: number;
  start?: string;
  className?: string;
}

/**
 * Reveal por scroll con GSAP + ScrollTrigger. Respeta prefers-reduced-motion.
 */
export default function GsapReveal({
  children,
  selector,
  y = 40,
  stagger = 0.09,
  duration = 0.8,
  start = 'top 82%',
  className,
}: GsapRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const targets = selector ? el.querySelectorAll(selector) : [el];
      if (!targets.length) return;
      gsap.from(targets, {
        opacity: 0,
        y,
        duration,
        stagger,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [selector, y, stagger, duration, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
