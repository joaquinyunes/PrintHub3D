"use client";

import { useRef, useState, useEffect } from "react";

interface VideoSectionProps {
  videoUrl?: string;
  title?: string;
  price?: string;
  subtitle?: string;
}

export default function VideoSection({ 
  videoUrl = "/mp_.mp4", 
  title = "Impresora 3D Bambu Lab", 
  price = "469000",
  subtitle = "La mejor tecnología en impresión 3D"
}: VideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!hasPlayed && videoRef.current) {
            videoRef.current.play();
            setHasPlayed(true);
          }
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById("impresora-video");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, [hasPlayed]);

  return (
    <section id="impresora-video" className="relative w-full h-[70vh] bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
      />
      
      {/* Overlay con info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-2 text-white text-sm font-medium mb-4">
            🖨️ Nueva generación
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-3">
            {title}
          </h2>
          <p className="text-gray-300 text-lg mb-6">{subtitle}</p>
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl px-8 py-4">
            <span className="text-3xl md:text-4xl font-black text-white">
              ${Number(price).toLocaleString('es-AR')}
            </span>
            <span className="text-white/70 text-sm ml-2">IVA incluido</span>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => window.open(`https://wa.me/5493794000000?text=Hola! Me interesa la ${title}`, '_blank')}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105"
            >
              💬 Consultar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}