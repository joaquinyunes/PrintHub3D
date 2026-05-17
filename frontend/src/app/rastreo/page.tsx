"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Package, CheckCircle, Clock, Truck, XCircle, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { WHATSAPP_PHONE } from "@/lib/config";
import { motion } from "framer-motion";
import { findCustomVideoUrl } from "@/lib/customCodeVideoMatch";

interface SectionData {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  categories: SectionCategory[];
  customVideos: Array<{ code: string; videoUrl: string; title: string; description: string }>;
}

interface SectionCategory {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  description?: string;
}

interface Order {
  _id: string;
  trackingCode: string;
  clientName: string;
  status: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
  createdAt: string;
}

const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  pending: { icon: Clock, label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  in_progress: { icon: Package, label: 'En Producción', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  completed: { icon: CheckCircle, label: 'Listo', color: 'text-green-400', bg: 'bg-green-500/20' },
  delivered: { icon: Truck, label: 'Entregado', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  cancelled: { icon: XCircle, label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/20' },
};

export default function RastreoPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [sectionData, setSectionData] = useState<SectionData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadData();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setTrackingCode(code);
      handleTrack(code);
    }
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(apiUrl("/api/settings/public"));
      if (res.ok) {
        const data = await res.json();
        setSectionData(data.rastreoSection || {
          enabled: true,
          title: 'Rastreá tu Pedido',
          subtitle: 'Ingresá tu código y seguí tu pedido en tiempo real',
          badge: '📦 RASTREO',
          customVideos: []
        });
      }
    } catch (e) {
      console.error("Error loading rastreo:", e);
    }
  };

  const handleTrack = async (code?: string) => {
    const targetCode = code || trackingCode.trim();
    if (!targetCode) return;
    
    setLoading(true);
    setError("");
    setOrder(null);
    
    try {
      const res = await fetch(apiUrl(`/api/orders/track/${encodeURIComponent(targetCode)}`));
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        const data = await res.json();
        setError(data.message || "No se encontró el pedido");
      }
    } catch (e) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const config = order ? statusConfig[order.status] : null;
  const StatusIcon = config?.icon;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-600/5 via-transparent to-transparent rounded-full" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Volver</span>
          </Link>
          <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Rastreo</span>
          <div className="w-20" />
        </div>
      </div>

      <div className="pt-24 pb-12 px-4 min-h-screen flex flex-col items-center justify-center relative">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, type: "spring" }} className="mb-8">
          <div className="relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-24 h-24 rounded-full border-2 border-dashed border-blue-500/30" />
            <div className="absolute inset-2 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center">
              <Package className="w-10 h-10 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full mb-4">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            {sectionData?.badge || '📦 RASTREO'}
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">{sectionData?.title || 'Rastreá tu Pedido'}</h1>
          <p className="text-gray-400 text-xl max-w-lg mx-auto">{sectionData?.subtitle || 'Ingresá tu código y seguí tu pedido en tiempo real'}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full max-w-xl space-y-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ingresá tu código de seguimiento"
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-800 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleTrack()} disabled={loading || !trackingCode.trim()} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 text-white px-8 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Package className="w-5 h-5" />Rastrear</>}
              </motion.button>
            </div>
          </div>

          {sectionData?.categories && sectionData.categories.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-4 text-center">Categorías de Seguimiento</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sectionData.categories.map((cat) => (
                  <motion.div whileHover={{ scale: 1.02 }} key={cat.id} className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-4 text-center hover:border-blue-500/40 transition cursor-pointer">
                    {cat.imageUrl && <img src={cat.imageUrl} alt={cat.name} className="w-16 h-16 object-cover rounded-lg mx-auto mb-3" />}
                    <div className="text-3xl mb-2">{cat.icon || '📦'}</div>
                    <h4 className="font-bold text-white">{cat.name}</h4>
                    {cat.description && <p className="text-gray-400 text-sm mt-1">{cat.description}</p>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-red-400">{error}</p>
              <p className="text-gray-500 text-sm mt-2">Consultá por WhatsApp si no encontrás tu pedido</p>
              <a href={`https://wa.me/${WHATSAPP_PHONE}?text=Hola! No encontré mi pedido con código: ${trackingCode}`} target="_blank" className="inline-block mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium">Consultar por WhatsApp</a>
            </motion.div>
          )}

          {order && config && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              {(() => { const customVideoUrl = findCustomVideoUrl(order.trackingCode, sectionData?.customVideos); return customVideoUrl ? <video src={customVideoUrl} controls className="w-full rounded-xl border border-purple-500/30" preload="metadata" /> : null; })()}
              <div className={`p-4 rounded-xl ${config.bg}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>{StatusIcon && <StatusIcon className={`w-6 h-6 ${config.color}`} />}</div>
                  <div><p className={`font-bold ${config.color}`}>{config.label || order.status}</p><p className="text-gray-500 text-sm">Código: {order.trackingCode}</p></div>
                </div>
              </div>
              <div className="bg-gray-800/20 rounded-xl p-4">
                <h3 className="font-bold mb-2">Datos del pedido</h3>
                <p className="text-gray-400">Cliente: <span className="text-white">{order.clientName}</span></p>
                <p className="text-gray-400">Fecha: <span className="text-white">{new Date(order.createdAt).toLocaleDateString('es-AR')}</span></p>
              </div>
              <div className="bg-gray-800/20 rounded-xl p-4">
                <h3 className="font-bold mb-2">Productos</h3>
                {order.items?.map((item, i) => (<div key={i} className="flex justify-between py-2 border-b border-gray-700 last:border-0"><span className="text-gray-300">{item.productName} x{item.quantity}</span><span className="text-blue-400">${item.price?.toLocaleString()}</span></div>))}
              </div>
              <a href={`https://wa.me/${WHATSAPP_PHONE}?text=Hola! Tengo una consulta sobre mi pedido: ${order.trackingCode}`} target="_blank" className="block w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-center">Consultar por WhatsApp</a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}