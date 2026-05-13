"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, CheckCircle, Clock, Zap, Box, Star } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface StatusStep {
  key: string;
  label: string;
  isComplete: boolean;
  isCurrent: boolean;
  media?: {
    image?: string;
    video?: string;
    message: string;
  };
}

interface OrderData {
  trackingCode: string;
  clientName: string;
  status: string;
  statusLabel: string;
  progress: number;
  dueDate: string;
  createdAt: string;
  notes: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  deposit: number;
  media: {
    image?: string;
    video?: string;
    message: string;
  };
  statusSteps: StatusStep[];
  customVideoUrl?: string | null;
  customerSatisfaction?: number;
  customerFeedback?: string;
}

function TrackContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customVideo, setCustomVideo] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!code) {
      router.push("/");
      return;
    }
    
    const fetchOrder = async () => {
      try {
        const res = await fetch(apiUrl(`/api/orders/track/${encodeURIComponent(code)}`));
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Pedido no encontrado");
        
        setOrder(data);

        const rawVideo = data.customVideoUrl;
        if (rawVideo && String(rawVideo).trim()) {
          const u = String(rawVideo).trim();
          // Si el video es de /uploads, usamos apiUrl para el puerto 5000
          const absolute = u.startsWith("/uploads") 
            ? apiUrl(u) 
            : (u.startsWith("http") ? u : (u.startsWith("/") ? u : `/${u}`));
          setCustomVideo(absolute);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar el pedido");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [code, router]);

  useEffect(() => {
    if (videoRef.current && customVideo) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log("Autoplay bloqueado:", e));
    }
  }, [customVideo]);

  const getStatusIcon = (step: StatusStep) => {
    if (step.isComplete) return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (step.isCurrent) return <Zap className="h-5 w-5 text-blue-400 animate-pulse" />;
    return <Clock className="h-5 w-5 text-zinc-600" />;
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <Package className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">¡Oops! Pedido no encontrado</h1>
      <p className="text-zinc-400 mb-6">{error}</p>
      <button onClick={() => router.push("/")} className="bg-blue-600 px-6 py-2 rounded-xl font-bold">Volver al inicio</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 h-16 flex items-center px-6 justify-between">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Global 3D</span>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-3xl mx-auto space-y-6">
        {/* PROGRESO */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Código</p>
              <h1 className="text-2xl font-black">{order.trackingCode}</h1>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Estado</p>
              <p className="text-lg font-bold text-blue-400">{order.statusLabel}</p>
            </div>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000" style={{ width: `${order.progress}%` }} />
          </div>
        </div>

        {/* VIDEO */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 overflow-hidden">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" /> Registro Visual
          </h2>
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5">
            {customVideo ? (
              <video
                ref={videoRef}
                key={customVideo}
                src={customVideo}
                controls
                autoPlay
                muted
                loop
                playsInline
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
              />
            ) : order.media?.image ? (
              <img src={order.media.image} alt="Estado" className="w-full h-full object-cover" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <Box className="h-16 w-16 mb-2 animate-pulse" />
                <p>Procesando multimedia...</p>
              </div>
            )}
          </div>
          <p className="text-zinc-400 text-sm mt-4 text-center italic">{order.media?.message}</p>
        </div>

        {/* TIMELINE */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8">Línea de Tiempo</h3>
          <div className="space-y-8 relative">
            <div className="absolute left-[10px] top-2 bottom-2 w-[1px] bg-zinc-800" />
            {order.statusSteps?.map((step) => (
              <div key={step.key} className="flex items-start gap-6 relative z-10">
                <div className={`mt-1 p-1 rounded-full bg-black border ${step.isComplete ? 'border-green-400' : 'border-zinc-800'}`}>
                  {getStatusIcon(step)}
                </div>
                <p className={`font-bold ${step.isComplete ? 'text-white' : 'text-zinc-600'}`}>{step.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando...</div>}>
      <TrackContentInner />
    </Suspense>
  );
}