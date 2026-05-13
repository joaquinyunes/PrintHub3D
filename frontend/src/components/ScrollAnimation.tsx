"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollAnimationProps {
  totalFrames?: number;
  nativeWidth?: number;
  nativeHeight?: number;
  framesDir?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  accentColor?: string;
  sectionId?: string;
}

export default function ScrollAnimation({
  totalFrames = 73,
  nativeWidth = 744,
  nativeHeight = 1232,
  framesDir = '/frames-copakling/',
  title = "Copa de la Liga",
  subtitle = "Diseño 3D de alta calidad",
  badge = "TROFEO PREMIUM",
  price = "$12.500",
  accentColor = "#f59e0b",
  sectionId = "scroll-animation-copa"
}: ScrollAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number>(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  
  const pad = (n: number) => String(n).padStart(4, '0');

  useEffect(() => {
    const handleFirstScroll = () => setHasScrolled(true);
    window.addEventListener('scroll', handleFirstScroll, { passive: true, once: true });
    return () => window.removeEventListener('scroll', handleFirstScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loadFrames = async () => {
      const frames: HTMLImageElement[] = [];
      let loadedCount = 0;

      for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        img.src = `${framesDir}frame_${pad(i)}.jpg`;
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
            frames[i - 1] = img;
            resolve();
          };
          img.onerror = () => {
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
            resolve();
          };
        });
      }

      framesRef.current = frames;
      setLoading(false);
      setLoaded(true);
    };

    loadFrames();
  }, [totalFrames, framesDir]);

  useEffect(() => {
    if (!loaded || !hasScrolled) return;

    const canvas = canvasRef.current;
    const section = containerRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let sectionTop = 0;
    let scrollRange = 0;
    let hasStarted = false;

    const updateMetrics = () => {
      const rect = section.getBoundingClientRect();
      sectionTop = window.scrollY + rect.top;
      scrollRange = rect.height - window.innerHeight;
    };

    const drawFrame = (idx: number) => {
      const frame = framesRef.current[idx];
      if (!frame || !frame.complete || !frame.naturalWidth) return;

      const dpr = window.devicePixelRatio || 1;
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      canvas.width = Math.round(vpW * dpr);
      canvas.height = Math.round(vpH * dpr);
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, vpW, vpH);

      const imgAspect = frame.naturalWidth / frame.naturalHeight;
      const canvasAspect = vpW / vpH;

      let sx, sy, sw, sh;
      if (canvasAspect > imgAspect) {
        sh = frame.naturalHeight;
        sw = sh * canvasAspect;
        sx = (frame.naturalWidth - sw) / 2;
        sy = 0;
      } else {
        sw = frame.naturalWidth;
        sh = sw / canvasAspect;
        sx = 0;
        sy = (frame.naturalHeight - sh) / 2;
      }
      
      ctx.drawImage(frame, sx, sy, sw, sh, 0, 0, vpW, vpH);
    };

    let lastIdx = 0;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrolled = scrollY - sectionTop;
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
      const targetIdx = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));

      if (targetIdx !== lastIdx) {
        lastIdx = targetIdx;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(targetIdx));
      }

      const isInView = progress >= 0 && progress <= 1;
      if (isInView && !hasStarted) hasStarted = true;

      setShowInfo(progress > 0.3);
    };

    const handleResize = () => {
      updateMetrics();
      const rect = section.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrolled = scrollY - sectionTop;
      const progress = Math.max(0, Math.min(1, scrolled / (rect.height - window.innerHeight)));
      const idx = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));
      drawFrame(idx);
    };

    updateMetrics();
    drawFrame(0);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loaded, hasScrolled, totalFrames]);

  const accent = accentColor || '#f59e0b';

  return (
    <div 
      id={sectionId}
      ref={containerRef} 
      style={{ 
        height: "500vh", 
        position: "relative", 
        backgroundColor: "#0a0a0f" 
      }}
    >
      {/* Animated glow background */}
      <div style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100vw",
        height: "100vh",
        background: `radial-gradient(ellipse at center, ${accent}12 0%, transparent 60%)`,
        pointerEvents: "none",
        zIndex: 1
      }} />

      <div style={{ 
        position: "sticky", 
        top: 0, 
        width: "100vw", 
        height: "100vh", 
        overflow: "hidden", 
        backgroundColor: "#0a0a0f",
        zIndex: 2
      }}>
        {/* Loading Screen */}
        {loading && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            backgroundColor: "#0a0a0f"
          }}>
            {/* Trophy icon with glow */}
            <div style={{
              fontSize: "56px",
              marginBottom: "1.5rem",
              filter: `drop-shadow(0 0 20px ${accent})`
            }}>
              🏆
            </div>
            
            {/* Progress bar */}
            <div style={{
              width: "240px",
              height: "3px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "3px",
              overflow: "hidden",
              marginBottom: "1rem"
            }}>
              <div style={{
                width: `${loadProgress}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                transition: "width 0.25s ease"
              }} />
            </div>
            
            <p style={{ 
              color: "rgba(255,255,255,0.75)", 
              fontSize: "13px"
            }}>
              Cargando experiencia... {loadProgress}%
            </p>
          </div>
        )}

        {/* Canvas - Full screen */}
        <canvas
          ref={canvasRef}
          style={{ 
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: loading ? "none" : "block"
          }}
        />

        {/* Top gradient */}
        {!loading && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100px",
            background: "linear-gradient(to bottom, rgba(10,10,15,0.9) 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 5
          }} />
        )}

        {/* Bottom gradient with content */}
        <div style={{ 
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 2rem 3rem",
          background: "linear-gradient(to top, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.7) 40%, transparent 100%)",
          transform: showInfo ? "translateY(0)" : "translateY(80px)",
          opacity: showInfo ? 1 : 0,
          transition: "all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          zIndex: 10
        }}>
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: `${accent}20`,
              border: `1px solid ${accent}50`,
              borderRadius: "9999px",
              padding: "0.6rem 1.5rem",
              marginBottom: "1.25rem"
            }}>
              <span style={{ fontSize: "18px" }}>🏆</span>
              <span style={{
                color: accent,
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase"
              }}>
                {badge}
              </span>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: "clamp(3rem, 8vw, 5rem)",
              fontWeight: "900",
              color: "white",
              lineHeight: 1,
              marginBottom: "0.75rem",
              letterSpacing: "-0.03em"
            }}>
              {title}
            </h2>
            
            {/* Subtitle */}
            <p style={{
              fontSize: "1.125rem",
              color: "rgba(255,255,255,0.55)",
              marginBottom: "2rem"
            }}>
              {subtitle}
            </p>

            {/* Price card */}
            <div style={{
              display: "inline-block",
              background: `${accent}15`,
              backdropFilter: "blur(10px)",
              borderRadius: "1.25rem",
              padding: "1rem 2.5rem",
              marginBottom: "1.5rem",
              border: `1px solid ${accent}40`
            }}>
              <span style={{
                fontSize: "2.75rem",
                fontWeight: "900",
                color: accent
              }}>
                {price}
              </span>
            </div>

            {/* Features */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              marginBottom: "2rem",
              flexWrap: "wrap"
            }}>
              {["PLA Premium", "100% Personalizado", "Envío Gratis"].map((feat, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "13px"
                }}>
                  <span style={{ color: "#4ade80" }}>✓</span>
                  {feat}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button 
              onClick={() => window.open(`https://wa.me/5493794000000?text=Hola! Me interesa: ${title}`, '_blank')}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                color: "white",
                padding: "1.1rem 2.5rem",
                borderRadius: "0.75rem",
                fontWeight: "700",
                fontSize: "15px",
                border: "none",
                cursor: "pointer",
                boxShadow: `0 8px 30px ${accent}40`
              }}
            >
              <span style={{ fontSize: "18px" }}>💬</span>
              Consultar ahora
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        {loaded && !showInfo && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            zIndex: 15
          }}>
            <div style={{
              width: "1px",
              height: "60px",
              background: `linear-gradient(to bottom, ${accent}, transparent)`
            }} />
            <span style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.15em"
            }}>
              Deslizar
            </span>
            <div style={{
              width: "1px",
              height: "60px",
              background: `linear-gradient(to top, ${accent}, transparent)`
            }} />
          </div>
        )}
      </div>
    </div>
  );
}