'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { createJourney, type JourneyEngine } from './journey/engine';
import type { ItemKind } from './journey/objects';
import type { JourneyCta, JourneyItemCopy } from './journey/presets';

export interface ScrollJourneyProps {
  sectionId?: string;
  aisle: string;
  aisleTitle: string;
  titleLines: string[];
  intro: string;
  items: JourneyItemCopy[];
  outroTitle: string;
  outroText: string;
  ctas: JourneyCta[];
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/**
 * Pasillo de supermercado en 3D atado al scroll: la cámara camina entre góndolas y
 * cada pieza sale de su estante al acercarte. El progreso se lee en cada fotograma
 * (no de eventos de scroll), así que en el celular sigue al dedo sin saltos.
 */
export default function ScrollJourney({
  sectionId,
  aisle,
  aisleTitle,
  titleLines,
  intro,
  items,
  outroTitle,
  outroText,
  ctas,
}: ScrollJourneyProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const [active, setActive] = useState(-1);
  const [fallback, setFallback] = useState(false);

  const total = items.length;
  // clave estable: los textos pueden cambiar sin recrear la escena WebGL
  const kindsKey = items.map((i) => i.kind).join(',');
  const railVh = 100 + (total + 1) * 95;

  // Estado inicial de la entrada (antes del primer pintado, sin parpadeo).
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.set(stage.querySelectorAll('[data-line]'), { yPercent: 115 });
    gsap.set(stage.querySelectorAll('[data-fade]'), { y: 22, opacity: 0 });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (fallback || !section || !stage || !canvas) return;
    const kinds = kindsKey.split(',') as ItemKind[];

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile =
      window.matchMedia('(max-width: 767px)').matches ||
      window.matchMedia('(pointer: coarse)').matches;

    let engine: JourneyEngine | null = null;
    let raf = 0;
    let inView = false;
    let pageVisible = !document.hidden;
    let lost = false;
    let last = performance.now();
    let currentActive = -1;
    let introPlayed = false;
    const ptr = { x: 0, y: 0 };
    const cleanups: Array<() => void> = [];

    const playIntro = () => {
      if (introPlayed) return;
      introPlayed = true;
      engine?.intro();
      if (reduce) return;
      const tl = gsap.timeline();
      tl.to(stage.querySelectorAll('[data-line]'), {
        yPercent: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.12,
      }).to(
        stage.querySelectorAll('[data-fade]'),
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08 },
        0.1,
      );
      cleanups.push(() => tl.kill());
    };

    const loop = (now: number) => {
      raf = 0;
      if (!engine || !inView || !pageVisible || lost) return;
      const dt = (now - last) / 1000;
      last = now;
      const rect = section.getBoundingClientRect();
      const range = section.offsetHeight - stage.offsetHeight;
      const raw = range > 0 ? clamp(-rect.top / range) : 0;
      const info = engine.frame(raw, dt, ptr);

      const x = info.progress * (total + 1);
      barsRef.current.forEach((el, k) => {
        if (el) el.style.transform = `scaleX(${clamp(x - k)})`;
      });
      const idx = Math.min(total, info.index);
      if (idx !== currentActive) {
        currentActive = idx;
        setActive(idx);
      }
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!raf && engine && inView && pageVisible && !lost) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const start = () => {
      if (engine) return;
      try {
        engine = createJourney({
          canvas,
          kinds,
          aisleLabel: aisle,
          aisleTitle,
          mobile,
          reduceMotion: reduce,
        });
      } catch {
        queueMicrotask(() => setFallback(true));
        return;
      }
      engine.resize(stage.clientWidth, stage.clientHeight);
      // Si el navegador suelta el contexto (memoria/GPU) esperamos a que lo devuelva;
      // si no vuelve, queda la versión estática.
      let giveUp = 0;
      const onLost = (e: Event) => {
        e.preventDefault();
        lost = true;
        giveUp = window.setTimeout(() => setFallback(true), 5000);
      };
      const onRestored = () => {
        window.clearTimeout(giveUp);
        lost = false;
        engine?.resize(stage.clientWidth, stage.clientHeight);
        kick();
      };
      canvas.addEventListener('webglcontextlost', onLost);
      canvas.addEventListener('webglcontextrestored', onRestored);
      cleanups.push(() => {
        window.clearTimeout(giveUp);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
      });
      kick();
    };

    // La escena se crea recién cuando la sección está cerca (no pesa en la carga).
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          near.disconnect();
        }
      },
      { rootMargin: '60% 0px' },
    );
    near.observe(section);

    const visible = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        if (inView) kick();
      },
      { rootMargin: '10% 0px' },
    );
    visible.observe(section);

    // La entrada corre cuando el escenario ya se ve de verdad.
    const entered = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          playIntro();
          entered.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    entered.observe(stage);

    const ro = new ResizeObserver(() => engine?.resize(stage.clientWidth, stage.clientHeight));
    ro.observe(stage);

    const onVis = () => {
      pageVisible = !document.hidden;
      if (pageVisible) kick();
    };
    document.addEventListener('visibilitychange', onVis);

    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      near.disconnect();
      visible.disconnect();
      entered.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      cleanups.forEach((fn) => fn());
      engine?.dispose();
      engine = null;
    };
  }, [kindsKey, aisle, aisleTitle, total, fallback]);

  const buttons = (cls = '') => (
    <div className={`flex flex-wrap gap-3 ${cls}`}>
      {ctas.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          tabIndex={fallback || active === total ? 0 : -1}
          className={`btn ${c.primary ? 'btn-ink' : 'btn-paper'}`}
        >
          {c.label}
        </Link>
      ))}
    </div>
  );

  const label = `${aisle} · ${aisleTitle}`;

  if (fallback) {
    // Sin WebGL (o contexto perdido): la misma información, estática.
    return (
      <section id={sectionId} className="store border-y-2 border-ink px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <span className="tag">{label}</span>
          <h2 className="font-display mt-4 text-4xl uppercase md:text-5xl">{titleLines.join(' ')}</h2>
          <p className="mt-3 max-w-xl text-ink-soft">{intro}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <article key={it.name} className="card-hard overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image}
                  alt=""
                  className="aspect-square w-full border-b-2 border-ink bg-paper-2 object-contain p-4"
                />
                <div className="p-4">
                  <h3 className="font-display text-xl uppercase">{it.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{it.text}</p>
                </div>
              </article>
            ))}
          </div>
          {buttons('mt-10')}
        </div>
      </section>
    );
  }

  return (
    <section
      id={sectionId}
      ref={sectionRef}
      aria-label={label}
      className="store relative border-y-2 border-ink"
      style={{ height: `${railVh}vh` }}
    >
      <div
        ref={stageRef}
        className="sticky top-16 w-full overflow-hidden bg-paper"
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

        {/* Legibilidad del texto: velo lateral (horizontal) o superior (vertical) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] bg-gradient-to-r from-paper from-30% via-paper/80 to-transparent landscape:block" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-paper from-55% to-transparent portrait:block landscape:hidden" />

        <div className="pointer-events-none absolute left-0 top-0 z-10 flex w-full flex-col portrait:px-4 portrait:pt-5 landscape:h-full landscape:w-[48%] landscape:max-w-[40rem] landscape:justify-center landscape:px-10 lg:landscape:px-16">
          <div data-fade className="mb-4">
            <span className="tag">{label}</span>
          </div>
          <h2 className="font-display text-[clamp(1.9rem,5vw,3.6rem)] uppercase leading-[1]">
            {titleLines.map((line) => (
              <span key={line} className="block overflow-hidden pb-1">
                <span data-line className="block">
                  {line}
                </span>
              </span>
            ))}
          </h2>
          <p data-fade className="mt-3 hidden max-w-md text-ink-soft sm:block">
            {intro}
          </p>

          <div data-fade className="relative mt-4 grid min-h-[11rem] md:mt-8 md:min-h-[12rem]">
            {items.map((it, i) => (
              <div
                key={it.name + i}
                aria-hidden={active !== i}
                className={`col-start-1 row-start-1 transition-all duration-500 ease-out ${
                  active === i ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                }`}
              >
                <div className="card-hard flex items-start gap-4 p-4 md:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-ink-soft">
                        Góndola {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                      </span>
                      {it.price && <span className="tag">{it.price}</span>}
                    </div>
                    <h3 className="font-display text-2xl uppercase leading-tight md:text-3xl">{it.name}</h3>
                    <p className="mt-1.5 text-sm text-ink-soft md:text-base">{it.text}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {it.tags.map((t) => (
                        <span key={t} className="tag-plain">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {it.photo && (
                    // Foto real: entra con demora, cuando la pieza ya terminó de salir de la góndola.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.photo}
                      alt={it.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className={`h-28 w-28 shrink-0 rounded-sm border-2 border-ink object-cover transition-all duration-700 sm:h-36 sm:w-36 md:h-52 md:w-52 lg:h-60 lg:w-60 ${
                        active === i ? 'scale-100 opacity-100 delay-700' : 'scale-90 opacity-0'
                      }`}
                    />
                  )}
                </div>
              </div>
            ))}
            <div
              aria-hidden={active !== total}
              className={`col-start-1 row-start-1 transition-all duration-500 ease-out ${
                active === total
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-3 opacity-0'
              }`}
            >
              <div className="card-hard bg-signal p-4 md:p-5">
                <h3 className="font-display text-2xl uppercase leading-tight md:text-3xl">{outroTitle}</h3>
                <p className="mt-1.5 text-sm md:text-base">{outroText}</p>
                {buttons('mt-4')}
              </div>
            </div>
          </div>
        </div>

        {/* Avance por góndola */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-1.5 px-6">
          {Array.from({ length: total + 1 }).map((_, k) => (
            <span
              key={k}
              className="h-3 w-9 overflow-hidden rounded-sm border-2 border-ink bg-white md:w-14"
            >
              <span
                ref={(el) => {
                  barsRef.current[k] = el;
                }}
                className="block h-full origin-left bg-signal"
                style={{ transform: 'scaleX(0)' }}
              />
            </span>
          ))}
        </div>

        <div
          aria-hidden
          className={`pointer-events-none absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-xs font-extrabold uppercase tracking-[0.25em] text-ink-soft transition-opacity duration-500 ${
            active === -1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Scrolleá para caminar el pasillo
        </div>
      </div>
    </section>
  );
}
