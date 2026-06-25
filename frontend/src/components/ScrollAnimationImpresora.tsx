"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollAnimationProps {
  videoSrc?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  accentColor?: string;
  sectionId?: string;
}

export default function ScrollAnimationImpresora({
  videoSrc = "/mp_.mp4",
  title = "Impresora 3D Bambu Lab",
  subtitle = "La nueva generación de precisión y velocidad",
  badge = "Profesional",
  price = "$469.000",
  accentColor = "#3b82f6",
  sectionId = "scroll-animation-impresora"
}: ScrollAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      video.currentTime = 0;
      setLoading(false);
      setLoaded(true);
    };

    if (video.readyState >= 2) {
      handleCanPlay();
    } else {
      video.addEventListener("canplay", handleCanPlay);
    }

    return () => video.removeEventListener("canplay", handleCanPlay);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    const section = containerRef.current;
    const video = videoRef.current;
    if (!canvas || !section || !video) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let sectionTop = 0;
    let scrollRange = 0;
    let lastTime = -1;

    const updateMetrics = () => {
      const rect = section.getBoundingClientRect();
      sectionTop = window.scrollY + rect.top;
      scrollRange = rect.height - window.innerHeight;
    };

    const drawFrame = () => {
      if (!video.videoWidth) return;
      const dpr = window.devicePixelRatio || 1;
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      canvas.width = Math.round(vpW * dpr);
      canvas.height = Math.round(vpH * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, vpW, vpH);

      const imgAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = vpW / vpH;

      let sx, sy, sw, sh;
      if (canvasAspect > imgAspect) {
        sh = video.videoHeight;
        sw = sh * canvasAspect;
        sx = (video.videoWidth - sw) / 2;
        sy = 0;
      } else {
        sw = video.videoWidth;
        sh = sw / canvasAspect;
        sx = 0;
        sy = (video.videoHeight - sh) / 2;
      }

      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, vpW, vpH);
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrolled = scrollY - sectionTop;
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));

      const targetTime = progress * video.duration;
      if (Math.abs(targetTime - lastTime) > 0.03) {
        lastTime = targetTime;
        video.currentTime = targetTime;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(drawFrame);
      }

      setShowInfo(progress > 0.3);
    };

    const handleResize = () => {
      updateMetrics();
      drawFrame();
    };

    updateMetrics();
    video.currentTime = 0;
    video.addEventListener("seeked", drawFrame);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      video.removeEventListener("seeked", drawFrame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loaded]);

  return (
    <div
      id={sectionId}
      ref={containerRef}
      style={{ height: "500vh", position: "relative", backgroundColor: "#000" }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        preload="auto"
        playsInline
        muted
        style={{ display: "none" }}
      />

      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translate(-50%, -50%)", width: "100%", height: "100vh",
        background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 50%)`,
        pointerEvents: "none", zIndex: 1
      }} />

      <div style={{
        position: "sticky", top: 0, width: "100%", height: "100vh",
        overflow: "hidden", backgroundColor: "#000", zIndex: 2
      }}>
        {loading && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            zIndex: 30, backgroundColor: "#000"
          }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              border: `3px solid ${accentColor}20`, borderTopColor: accentColor,
              animation: "spin 0.8s linear infinite", marginBottom: "1.5rem"
            }} />
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: "500" }}>Cargando video...</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100vh", display: loading ? "none" : "block" }}
        />

        {!loading && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "120px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
            pointerEvents: "none", zIndex: 5
          }} />
        )}

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "0 2rem 3rem",
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
          transform: showInfo ? "translateY(0)" : "translateY(60px)",
          opacity: showInfo ? 1 : 0,
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: 10
        }}>
          <div className="max-w-3xl mx-auto text-center">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: `${accentColor}25`, border: `1px solid ${accentColor}40`,
              borderRadius: "9999px", padding: "0.6rem 1.25rem", marginBottom: "1.25rem"
            }}>
              <span style={{ fontSize: "16px" }}>🖨️</span>
              <span style={{ color: accentColor, fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>{badge}</span>
            </div>
            <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: "800", color: "white", lineHeight: 1.1, marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>{title}</h2>
            <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.65)", marginBottom: "2rem" }}>{subtitle}</p>
            <div style={{
              display: "inline-block", background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)", borderRadius: "1rem",
              padding: "1rem 2.5rem", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <span style={{ fontSize: "2.5rem", fontWeight: "800", color: "white" }}>{price}</span>
            </div>
            <button
              onClick={() => window.open(`https://wa.me/5493794000000?text=Hola! Me interesa: ${title}`, "_blank")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.75rem",
                background: "#22c55e", color: "white", padding: "1rem 2rem",
                borderRadius: "0.75rem", fontWeight: "700", fontSize: "15px",
                border: "none", cursor: "pointer", boxShadow: "0 8px 32px rgba(34, 197, 94, 0.35)"
              }}
            >
              💬 Consultar
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
