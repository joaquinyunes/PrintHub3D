"use client";

import React from "react";
import { Package, Zap, Award, Truck, HeadphonesIcon, Sparkles, ArrowRight, Star, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { WHATSAPP_PHONE } from "@/lib/config";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  trackingCode: string;
  setTrackingCode: (v: string) => void;
  handleTrackOrder: (e: React.FormEvent) => void;
  handleWhatsAppBuy: (item: any) => void;
  user: any;
  handleLogout: () => void;
  heroData?: {
    title?: string;
    subtitle?: string;
    description?: string;
    badge?: string;
    stats?: { reviews: string; reviewsCount: string; orders: string; delivery: string };
    features?: string[];
  };
}

const defaultFeatures = ["Impresión rápida", "Calidad premium", "Envío rápido", "Soporte 24/7"];
const featureIcons = [Zap, Award, Truck, HeadphonesIcon];
const featureColors = [
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-pink-500",
  "from-blue-400 to-cyan-500",
  "from-green-400 to-emerald-500",
];

// ==========================================
// COMPONENTE ANIMATED LETTERS CORREGIDO
// Animación minimalista por Opacidad (Evita el bug del texto transparente)
// ==========================================
const AnimatedLetters = ({ text, className }: { text: string; className?: string }) => {
  const words = text.split(" ");
  let charCount = 0; // Mantiene el conteo para que la aparición sea secuencial

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={className}
      style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.25em" }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
          {word.split("").map((char, charIndex) => {
            const globalIndex = charCount++;
            return (
              <motion.span
                key={charIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: globalIndex * 0.04, // Aparición secuencial rápida y elegante
                }}
                style={{ display: "inline-block" }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </motion.div>
  );
};

export default function HeroSection({
  searchQuery, setSearchQuery, trackingCode, setTrackingCode, handleTrackOrder, handleWhatsAppBuy, user, handleLogout,
  heroData
}: HeroSectionProps) {
  const title = heroData?.title || "Global 3D";
  const subtitle = heroData?.subtitle || "Transformamos tus ideas en objetos reales.";
  const description = heroData?.description || "Impresión 3D de alta calidad en Corrientes";
  const badge = heroData?.badge || "Envíos gratis en pedidos mayores a $50.000";
  const stats = heroData?.stats || { reviews: "4.9", reviewsCount: "200+ reseñas", orders: "500+", delivery: "24-72h" };
  const features = heroData?.features || defaultFeatures;

  return (
    <header className="relative pt-28 pb-24 px-4 w-full overflow-hidden selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-purple-900/10 to-black pointer-events-none -z-20" />
      
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -z-10 pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-40 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" 
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl hover:bg-white/10 transition-all cursor-default shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-sm font-semibold text-gray-200 tracking-wide">{badge}</span>
          </div>
        </motion.div>

        <div className="relative inline-block mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 blur-2xl rounded-full" />
          
          <AnimatedLetters 
            text={title} 
            className="relative text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-cyan-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
          />
          
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
            className="mt-4 h-1.5 w-48 md:w-64 mx-auto bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
          />
        </div>

        <div className="mb-14 mt-6">
          <AnimatedLetters 
            text={subtitle}
            className="text-gray-200 text-2xl md:text-4xl max-w-3xl mx-auto leading-relaxed font-bold drop-shadow-md"
          />
          <div className="mt-4">
            <AnimatedLetters 
              text={description}
              className="text-blue-200/80 text-lg md:text-xl font-medium tracking-wide"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-10">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + i * 0.1, type: "spring" }}
              whileHover={{ y: -8, scale: 1.05, rotate: [-1, 1, 0] }}
              className="group flex flex-col items-center gap-3 px-5 py-6 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-zinc-800/50 shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]"
            >
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`p-4 rounded-2xl bg-gradient-to-br ${featureColors[i]} shadow-lg transition-transform duration-300`}
              >
                {React.createElement(featureIcons[i], { className: "w-8 h-8 text-white drop-shadow-md" })}
              </motion.div>
              <span className="text-sm md:text-base font-bold text-gray-200 text-center group-hover:text-white transition-colors">{f}</span>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6, type: "spring" }}
          className="flex flex-col md:flex-row items-center justify-center gap-10 mt-16 p-8 bg-zinc-900/40 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl"
        >
          <div className="text-center group cursor-default">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-md">{stats.reviews}</span>
            <div className="flex justify-center mt-2 gap-1 group-hover:scale-110 transition-transform">
              {[1,2,3,4,5].map((s, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8 + i * 0.1 }}
                >
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                </motion.div>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-400 mt-2 block uppercase tracking-wider">{stats.reviewsCount}</span>
          </div>
          
          <div className="hidden md:block w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          
          <div className="text-center group cursor-default">
            <div className="flex items-center justify-center gap-3 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span className="text-4xl font-black text-white">{stats.orders}</span>
            </div>
            <p className="text-sm font-medium text-gray-400 mt-2 uppercase tracking-wider">Pedidos Entregados</p>
          </div>
          
          <div className="hidden md:block w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          
          <div className="text-center group cursor-default">
            <div className="flex items-center justify-center gap-3 group-hover:scale-110 transition-transform">
              <Clock className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              <span className="text-4xl font-black text-white">{stats.delivery}</span>
            </div>
            <p className="text-sm font-medium text-gray-400 mt-2 uppercase tracking-wider">Tiempo de Entrega</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2, type: "spring" }}
          className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-16"
        >
          <a 
            href="#productos" 
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 overflow-hidden bg-white/5 border border-white/10 shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center gap-3 text-white">
              <Package className="w-6 h-6 group-hover:animate-bounce" />
              <span className="text-lg tracking-wide">Ver Catálogo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          
          <a 
            href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("Hola! Quiero info sobre impresiones 3D")}`} 
            target="_blank"
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_35px_rgba(34,197,94,0.6)]"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center gap-3 text-white">
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 2, delay: 3 }}
                className="text-2xl drop-shadow-md"
              >
                💬
              </motion.span>
              <span className="text-lg tracking-wide">Consultar por WhatsApp</span>
            </div>
          </a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2.2, type: "spring" }}
          className="mt-14 flex justify-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900/50 border border-white/5 rounded-full backdrop-blur-md hover:bg-zinc-800/50 hover:border-white/20 transition-all cursor-default">
            <span className="text-xl">📍</span>
            <span className="text-sm font-semibold text-gray-300 tracking-wider">Corrientes, Argentina</span>
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          </div>
        </motion.div>

      </div>
    </header>
  );
}
