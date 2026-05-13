"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollVideoProps {
  videoSrc?: string;
  title?: string;
  price?: string;
}

export default function ScrollVideo({ videoSrc = "/copakling-optimized.mp4", title, price }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const videoStartedRef = useRef(false);

  useEffect(() => {
    const handleFirstScroll = () => {
      setHasScrolled(true);
      window.removeEventListener('scroll', handleFirstScroll);
    };
    window.addEventListener('scroll', handleFirstScroll, { passive: true, once: true });
    return () => window.removeEventListener('scroll', handleFirstScroll);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!videoRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollProgress = -rect.top / (containerRef.current.offsetHeight - window.innerHeight);
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

      const isInView = clampedProgress >= 0 && clampedProgress <= 1;
      setIsActive(isInView);
      setShowInfo(clampedProgress > 0.5);

      if (isInView && hasScrolled && videoRef.current?.duration) {
        const targetTime = clampedProgress * videoRef.current.duration;
        if (Math.abs(videoRef.current.currentTime - targetTime) > 0.016) {
          videoRef.current.currentTime = targetTime;
        }
      } else {
        videoRef.current?.pause();
      }
    };

    const onScroll = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
  }, [hasScrolled]);

  return (
    <div ref={containerRef} style={{ height: "300vh", position: "relative" }}>
      <div style={{ 
        position: "sticky", 
        top: 0, 
        height: "100vh", 
        overflow: "hidden", 
        backgroundColor: "#000",
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.3s ease"
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.3) 0%, transparent 70%)",
          zIndex: 1
        }} />
        
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "contain",
            filter: "brightness(0.9) contrast(0.95)"
          }}
        />
        
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)",
          zIndex: 2
        }} />
        
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
          zIndex: 3
        }} />
        
        {title && price && (
          <div 
            className="transition-opacity duration-700"
            style={{ 
              opacity: showInfo ? 1 : 0,
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "3rem 2rem",
              background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
              zIndex: 4
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