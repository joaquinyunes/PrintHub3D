"use client";

import React, { Suspense, useEffect, useState } from "react";
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
  customerSatisfaction?: number;
  customerFeedback?: string;
  media: {
    image?: string;
    video?: string;
    message: string;
  };
  statusSteps: StatusStep[];
}

function TrackContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (!code) {
      router.push("/");
      return;
    }
    
    const fetchOrder = async () => {
      try {
        const res = await fetch(apiUrl(`/api/orders/track/${encodeURIComponent(code)}`));
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Pedido no encontrado");
        }
        
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar el pedido");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [code, router]);

  const getStatusIcon = (step: StatusStep) => {
    if (step.isComplete) return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (step.isCurrent) return <Zap className="h-5 w-5 text-blue-400 animate-pulse" />;
    return <Clock className="h-5 w-5 text-zinc-600" />;
  };

  const getStatusColor = (step: StatusStep) => {
    if (step.isComplete) return "text-green-400";
    if (step.isCurrent) return "text-blue-400";
    return "text-zinc-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-md">
          <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Pedido No Encontrado</h1>
          <p className="text-gray-400 mb-4">{error || "El código proporcionado no corresponde a ningún pedido"}</p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Global 3D
          </span>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Código de seguimiento</p>
                <h1 className="text-2xl font-bold text-white">{order.trackingCode}</h1>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Estado</p>
                <p className="text-lg font-medium text-blue-400">{order.statusLabel}</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${order.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-6 w-6 text-blue-400" />
              <h2 className="text-lg font-bold">Estado de tu Pedido</h2>
            </div>
            
            <div className="aspect-video bg-zinc-800 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
              {order.media?.video ? (
                <video 
                  src={order.media.video} 
                  autoPlay 
                  loop 
                  muted 
                  className="w-full h-full object-cover"
                />
              ) : order.media?.image ? (
                <img 
                  src={order.media.image} 
                  alt={order.statusLabel}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <Box className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-gray-400">{order.media?.message}</p>
                </div>
              )}
            </div>
            
            <p className="text-gray-300 text-center">{order.media?.message}</p>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Progreso</h3>
            <div className="space-y-4">
              {order.statusSteps?.map((step) => (
                <div key={step.key} className="flex items-start gap-4">
                  <div className={`mt-0.5 ${step.isComplete ? 'text-green-400' : step.isCurrent ? 'text-blue-400' : 'text-zinc-600'}`}>
                    {getStatusIcon(step)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${getStatusColor(step)}`}>{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Detalles del Pedido</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Cliente</span>
                <span className="text-white">{order.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha de creación</span>
                <span className="text-white">
                  {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </span>
              </div>
              {order.dueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Fecha de entrega</span>
                  <span className="text-white">
                    {new Date(order.dueDate).toLocaleDateString('es-AR')}
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Notas</span>
                  <span className="text-white text-right max-w-[200px]">{order.notes}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-2">Productos</p>
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2">
                  <span className="text-white">{item.productName} x{item.quantity}</span>
                  <span className="text-blue-400">${item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
                <span>Total</span>
                <span className="text-green-400">${order.total}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between">
                <span className="text-gray-400">Método de pago</span>
                <span className="text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seña</span>
                <span className="text-yellow-400">${order.deposit}</span>
              </div>
            </div>
          </div>

          {order.status === 'delivered' && order.customerSatisfaction && (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Tu Evaluación</h3>
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < order.customerSatisfaction! ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`} 
                  />
                ))}
              </div>
              {order.customerFeedback && (
                <p className="text-gray-300">"{order.customerFeedback}"</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <TrackContentInner />
    </Suspense>
  );
}