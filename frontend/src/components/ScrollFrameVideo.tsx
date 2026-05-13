"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollFrameVideoProps {
  totalFrames?: number;
  nativeWidth?: number;
  nativeHeight?: number;
  framesDir?: string;
  title?: string;
  price?: string;
}

export default function ScrollFrameVideo({ 
  totalFrames = 73, 
  nativeWidth = 744, 
  nativeHeight = 1232,
  framesDir = '/frames/',
  title, 
  price 
}: ScrollFrameVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(-1);
  const isInSectionRef = useRef(false);

  const pad = (n: number) => String(n).padStart(4, '0');

  useEffect(() => {
    const handleFirstScroll = () => {
      setHasScrolled(true);
      window.removeEventListener('scroll', handleFirstScroll);
    };
    window.addEventListener('scroll', handleFirstScroll, { passive: true, once: true });
    return () => window.removeEventListener('scroll', handleFirstScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const loadFrames = async () => {
      const frames: HTMLImageElement[] = [];
      let loaded = 0;

      for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        img.src = `${framesDir}frame_${pad(i)}.jpg`;
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            loaded++;
            setLoadProgress(Math.round((loaded / totalFrames) * 100));
            frames[i - 1] = img;
            resolve();
          };
          img.onerror = () => {
            loaded++;
            setLoadProgress(Math.round((loaded / totalFrames) * 100));
            resolve();
          };
        });
      }

      framesRef.current = frames;
      setLoading(false);
    };

    loadFrames();
  }, [totalFrames, framesDir]);

  const drawFrame = (idx: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const frame = framesRef.current[idx];
    
    if (!canvas || !ctx) return;

    const vpW = canvas.clientWidth;
    const vpH = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(vpW * dpr);
    canvas.height = Math.round(vpH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, vpW, vpH);

    if (!frame || !frame.complete || !frame.naturalWidth) return;

    const imgAspect = nativeWidth / nativeHeight;
    const canvasAspect = vpW / vpH;

    let destW, destH, destX, destY;

    if (canvasAspect > imgAspect) {
      destH = vpH;
      destW = vpH * imgAspect;
      destX = (vpW - destW) / 2;
      destY = 0;
    } else {
      destW = vpW;
      destH = vpW / imgAspect;
      destX = 0;
      destY = (vpH - destH) / 2;
    }

    ctx.drawImage(frame, destX, destY, destW, destH);
  };

  useEffect(() => {
    if (!hasScrolled || loading) return;

    let animationFrameId: number;
    let scrollStarted = false;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const sectionTop = containerRef.current.offsetTop;
      const scrollRange = containerRef.current.offsetHeight - window.innerHeight;
      const scrolled = window.scrollY - sectionTop;

      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
      const isInView = progress >= 0 && progress <= 1;

      if (isInView && !scrollStarted) {
        scrollStarted = true;
      }

      if (!isInView && scrollStarted) {
        if (currentFrameRef.current !== totalFrames - 1) {
          currentFrameRef.current = totalFrames - 1;
          drawFrame(totalFrames - 1);
        }
        return;
      }

      setIsActive(isInView);
      setShowInfo(progress > 0.5);

      if (isInView && scrollStarted) {
        const targetIdx = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));
        
        if (targetIdx !== currentFrameRef.current) {
          currentFrameRef.current = targetIdx;
          drawFrame(targetIdx);
        }
      }
    };

    const onScroll = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    const handleResize = () => {
      if (currentFrameRef.current >= 0) {
        drawFrame(currentFrameRef.current);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [hasScrolled, loading, totalFrames]);

  return (
    <div ref={containerRef} style={{ height: "300vh", position: "relative", backgroundColor: "#000" }}>
      <div style={{ 
        position: "sticky", 
        top: 0, 
        height: "100vh", 
        overflow: "hidden", 
        backgroundColor: "#000"
      }}>
        {loading && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#000", zIndex: 10
          }}>
            <div style={{
              width: "200px", height: "4px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "2px", overflow: "hidden"
            }}>
              <div style={{
                width: `${loadProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                transition: "width 0.3s ease"
              }} />
            </div>
            <p style={{ color: "white", marginTop: "1rem", fontSize: "14px" }}>
              Cargando frames... {loadProgress}%
            </p>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          style={{ 
            width: "100%", 
            height: "100%",
            display: loading ? "none" : "block",
            backgroundColor: "#000"
          }}
        />
        
        {title && price && (
          <div 
            style={{ 
              opacity: showInfo ? 1 : 0,
              transition: "opacity 0.7s ease",
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "3rem 2rem",
              background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
              pointerEvents: "none"
            }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
                borderRadius: "9999px",
                padding: "0.75rem 1.5rem",
                border: "1px solid rgba(255,255,255,0.2)"
              }}>
                <span style={{
                  width: "8px", height: "8px",
                  background: "#22c55e",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite"
                }} />
                <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
              </div>
              <p className="text-4xl md:text-5xl font-black text-white mt-4" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                ${Number(price).toLocaleString('es-AR')}
              </p>
              <p className="text-gray-300 text-sm mt-2">Incluye distribución en Corrientes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}