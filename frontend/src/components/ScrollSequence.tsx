'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollSequenceProps {
  framesDir: string;
  frameCount: number;
  nativeWidth: number;
  nativeHeight: number;
  /** Altura del "riel" de scroll en múltiplos de viewport. Más = más lento y suave. */
  scrollVh?: number;
  title?: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  accentColor?: string;
  sectionId?: string;
  emoji?: string;
}

const pad = (n: number) => String(n).padStart(4, '0');
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Secuencia de imágenes controlada por scroll (estilo Apple): un canvas fijo
 * (sticky) sobre el que se dibuja el frame según el progreso. El frame real
 * persigue al objetivo con interpolación => movimiento sedoso, sin saltos.
 */
export default function ScrollSequence({
  framesDir,
  frameCount,
  nativeWidth,
  nativeHeight,
  scrollVh = 4,
  title,
  subtitle,
  badge,
  price,
  accentColor = '#ff5c1a',
  sectionId,
  emoji = '▲',
}: ScrollSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Precarga de frames
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = `${framesDir}frame_${pad(i)}.jpg`;
      img.onload = img.onerror = () => {
        loaded++;
        if (cancelled) return;
        setProgressPct(Math.round((loaded / frameCount) * 100));
        // se muestra apenas hay un colchón de frames; el resto sigue cargando de fondo
        if (loaded >= Math.min(frameCount, Math.ceil(frameCount * 0.3))) setReady(true);
      };
      imgs[i - 1] = img;
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [framesDir, frameCount]);

  // Render loop
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!canvas || !stage || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let current = 0; // frame interpolado
    let target = 0; // frame objetivo (según scroll)
    let lastDrawn = -1;
    let infoShown = false;
    let raf = 0;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      const scrollable = container.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrollable > 0 ? scrolled / scrollable : 0));
      target = p * (frameCount - 1);
      const want = p > 0.24 && p < 0.99;
      if (want !== infoShown) {
        infoShown = want;
        setShowInfo(want);
      }
    };

    const draw = (idx: number): boolean => {
      // busca el frame pedido o el más cercano ya cargado (evita parpadeos en negro)
      let frame = framesRef.current[Math.max(0, Math.min(frameCount - 1, idx))];
      if (!frame || !frame.complete || !frame.naturalWidth) {
        for (let d = 1; d < frameCount; d++) {
          const a = framesRef.current[idx - d];
          const b = framesRef.current[idx + d];
          if (a && a.complete && a.naturalWidth) {
            frame = a;
            break;
          }
          if (b && b.complete && b.naturalWidth) {
            frame = b;
            break;
          }
        }
      }
      if (!frame || !frame.complete || !frame.naturalWidth) return false;

      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#08080b';
      ctx.fillRect(0, 0, w, h);

      // object-fit: contain con margen => la pieza se ve entera
      const imgAspect = nativeWidth / nativeHeight;
      const boxAspect = w / h;
      const fill = 0.92;
      let dw: number, dh: number;
      if (boxAspect > imgAspect) {
        dh = h * fill;
        dw = dh * imgAspect;
      } else {
        dw = w * fill;
        dh = dw / imgAspect;
      }
      ctx.drawImage(frame, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return true;
    };

    const step = () => {
      measure();
      // sin animación reducida: el frame "persigue" al objetivo => movimiento sedoso
      current = reduce ? target : lerp(current, target, 0.14);
      if (Math.abs(current - target) < 0.4) current = target;
      const idx = Math.round(current);
      if (idx !== lastDrawn) {
        if (draw(idx)) lastDrawn = idx;
      }
    };

    // rAF para el suavizado en pestañas visibles
    const tick = () => {
      step();
      raf = requestAnimationFrame(tick);
    };
    // Respaldo: setInterval sí corre en pestañas ocultas / sin rAF
    const iv = window.setInterval(step, 200);
    const onResize = () => {
      lastDrawn = -1;
      step();
    };

    measure();
    current = target;
    draw(Math.round(current));
    lastDrawn = Math.round(current);
    raf = requestAnimationFrame(tick);
    window.addEventListener('scroll', step, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
      window.removeEventListener('scroll', step);
      window.removeEventListener('resize', onResize);
    };
  }, [ready, frameCount, nativeWidth, nativeHeight]);

  return (
    <div
      id={sectionId}
      ref={containerRef}
      style={{ height: `${scrollVh * 100}vh`, position: 'relative', background: '#08080b' }}
    >
      <div
        ref={stageRef}
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          background: '#08080b',
        }}
      >
        {!ready && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 30,
              gap: '1rem',
            }}
          >
            <div style={{ fontSize: 44, filter: `drop-shadow(0 0 24px ${accentColor})` }}>
              {emoji}
            </div>
            <div
              style={{
                width: 220,
                height: 3,
                background: 'rgba(255,255,255,.1)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
                  transition: 'width .3s ease',
                }}
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, letterSpacing: '.08em' }}>
              CARGANDO EXPERIENCIA {progressPct}%
            </p>
          </div>
        )}

        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(130% 55% at 50% 108%, ${accentColor}26 0%, transparent 62%)`,
          }}
        />

        {(title || price) && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: '0 1.5rem 2.75rem',
              background:
                'linear-gradient(to top, rgba(8,8,11,.94) 0%, rgba(8,8,11,.5) 42%, transparent 100%)',
              transform: showInfo ? 'translateY(0)' : 'translateY(40px)',
              opacity: showInfo ? 1 : 0,
              transition:
                'transform .8s cubic-bezier(.22,1,.36,1), opacity .8s cubic-bezier(.22,1,.36,1)',
            }}
          >
            <div className="max-w-3xl mx-auto text-center">
              {badge && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.5rem',
                    background: `${accentColor}1f`,
                    border: `1px solid ${accentColor}55`,
                    borderRadius: 9999,
                    padding: '.45rem 1.15rem',
                    marginBottom: '.9rem',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{emoji}</span>
                  <span
                    style={{
                      color: accentColor,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {badge}
                  </span>
                </div>
              )}
              {title && (
                <h2
                  style={{
                    fontSize: 'clamp(2rem,5.5vw,3.6rem)',
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.05,
                    letterSpacing: '-.03em',
                    marginBottom: '.4rem',
                  }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  style={{
                    color: 'rgba(255,255,255,.55)',
                    fontSize: '1rem',
                    marginBottom: '1.1rem',
                  }}
                >
                  {subtitle}
                </p>
              )}
              {price && (
                <div
                  style={{
                    display: 'inline-block',
                    background: `${accentColor}14`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${accentColor}44`,
                    borderRadius: '1rem',
                    padding: '.7rem 1.9rem',
                  }}
                >
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: accentColor }}>
                    {price}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
