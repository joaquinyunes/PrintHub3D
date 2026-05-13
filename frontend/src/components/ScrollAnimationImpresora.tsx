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
  totalFrames = 192,
  nativeWidth = 1280,
  nativeHeight = 720,
  framesDir = '/frames-mp/',
  title = "Impresora 3D Bambu Lab",
  subtitle = "La nueva generación de precisión y velocidad",
  badge = "🖨️ PROFESIONAL",
  price = "$469.000",
  accentColor = "#3b82f6",
  sectionId = "scroll-animation-impresora"
}: ScrollAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
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
      ctx.fillStyle = '#000';
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
      setCurrentFrame(idx);
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

  const accent = accentColor || '#3b82f6';

  return (
    <div 
      id={sectionId}
      ref={containerRef} 
      style={{ 
        height: "500vh", 
        position: "relative", 
        backgroundColor: "#000" 
      }}
    >
      {/* Glowing background */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "150vw",
        height: "150vh",
        background: `radial-gradient(ellipse at center, ${accent}15 0%, transparent 50%)`,
        pointerEvents: "none",
        zIndex: 1
      }} />

      <div style={{ 
        position: "sticky", 
        top: 0, 
        width: "100vw", 
        height: "100vh", 
        overflow: "hidden", 
        backgroundColor: "#000",
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
            backgroundColor: "#000"
          }}>
            {/* Animated spinner */}
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              border: `3px solid ${accent}20`,
              borderTopColor: accent,
              animation: "spin 0.8s linear infinite",
              marginBottom: "1.5rem"
            }} />
            
            <div style={{
              width: "200px",
              height: "3px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "3px",
              overflow: "hidden",
              marginBottom: "1rem"
            }}>
              <div style={{
                width: `${loadProgress}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
                transition: "width 0.2s ease"
              }} />
            </div>
            
            <p style={{ 
              color: "rgba(255,255,255,0.8)", 
              fontSize: "13px", 
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: "500"
            }}>
              Cargando video... {loadProgress}%
            </p>
          </div>
        )}

        {/* Canvas - Full screen, no borders */}
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
            height: "120px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 5
          }} />
        )}

        {/* Bottom gradient with info */}
        <div style={{ 
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 2rem 3rem",
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
          transform: showInfo ? "translateY(0)" : "translateY(60px)",
          opacity: showInfo ? 1 : 0,
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 10
        }}>
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge pill */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: `${accent}25`,
              border: `1px solid ${accent}40`,
              borderRadius: "9999px",
              padding: "0.6rem 1.25rem",
              marginBottom: "1.25rem"
            }}>
              <span style={{ fontSize: "16px" }}>🖨️</span>
              <span style={{
                color: accent,
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}>
                {badge}
              </span>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: "800",
              color: "white",
              lineHeight: 1.1,
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em"
            }}>
              {title}
            </h2>
            
            {/* Subtitle */}
            <p style={{
              fontSize: "1.125rem",
              color: "rgba(255,255,255,0.65)",
              marginBottom: "2rem"
            }}>
              {subtitle}
            </p>

            {/* Price */}
            <div style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              borderRadius: "1rem",
              padding: "1rem 2.5rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <span style={{
                fontSize: "2.5rem",
                fontWeight: "800",
                color: "white"
              }}>
                {price}
              </span>
            </div>

            {/* CTA */}
            <button 
              onClick={() => window.open(`https://wa.me/5493794000000?text=Hola! Me interesa: ${title}`, '_blank')}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                background: "#22c55e",
                color: "white",
                padding: "1rem 2rem",
                borderRadius: "0.75rem",
                fontWeight: "700",
                fontSize: "15px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(34, 197, 94, 0.35)"
              }}
            >
              💬 Consultar
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
            gap: "0.75rem",
            zIndex: 15
          }}>
            <div style={{
              width: "40px",
              height: "60px",
              border: "2px solid rgba(255,255,255,0.25)",
              borderRadius: "20px",
              display: "flex",
              justifyContent: "center",
              paddingTop: "10px"
            }}>
              <div style={{
                width: "4px",
                height: "10px",
                background: "white",
                borderRadius: "2px",
                animation: "scrollBounce 1.5s infinite"
              }} />
            </div>
            <span style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.12em"
            }}>
              Deslizar
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(12px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}