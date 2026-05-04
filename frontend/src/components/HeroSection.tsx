"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, Box, Search, ArrowRight, Package, Zap, Award, Truck, HeadphonesIcon } from "lucide-react";
import { MotionDiv } from "./MotionDiv";
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
}

const features = [
  { icon: Zap, text: "Impresión rápida", color: "from-yellow-400 to-orange-500" },
  { icon: Award, text: "Calidad premium", color: "from-purple-400 to-pink-500" },
  { icon: Truck, text: "Envío rápido", color: "from-blue-400 to-cyan-500" },
  { icon: HeadphonesIcon, text: "Soporte 24/7", color: "from-green-400 to-emerald-500" },
];

export default function HeroSection({
  searchQuery, setSearchQuery, trackingCode, setTrackingCode, handleTrackOrder, handleWhatsAppBuy, user, handleLogout
}: HeroSectionProps) {
  return (
    <header className="relative pt-16 pb-12 px-4 overflow-hidden">
      {/* Fondo con gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-purple-950/20 to-black pointer-events-none" />
      
      {/* Elementos decorativos flotantes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute bottom-10 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500" />

      <div className="relative z-10">
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">🎉 Envíos gratis en pedidos mayores a $50.000</span>
          </div>
        </MotionDiv>

        <MotionDiv 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Global 3D
          </h1>
        </MotionDiv>

        <MotionDiv 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Transformamos tus ideas en objetos reales. Impresión 3D de alta calidad
          </p>
        </MotionDiv>

        <MotionDiv 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mt-6 h-[1px] w-48 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </MotionDiv>

        {/* Features con iconos */}
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4 mt-8"
        >
          {features.map((f, i) => (
            <div 
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105 cursor-default"
            >
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${f.color}`}>
                <f.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-300">{f.text}</span>
            </div>
          ))}
        </MotionDiv>

        {/* Estadísticas */}
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mt-8"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">4.9</span>
            <div className="flex">
              {"⭐⭐⭐⭐⭐".split("").map((s, i) => (
                <span key={i} className="text-yellow-400">{s}</span>
              ))}
            </div>
            <span className="text-gray-500">(200+ reseñas)</span>
          </div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">500+</span>
            <span className="text-gray-500">pedidos entregados</span>
          </div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">24-72</span>
            <span className="text-gray-500">hs de entrega</span>
          </div>
        </MotionDiv>

        {/* Botones de acción */}
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mt-10"
        >
          <a 
            href="#productos" 
            className="group px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:opacity-90 shadow-lg shadow-blue-500/30 rounded-2xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 flex items-center gap-3"
          >
            <Package className="w-5 h-5 group-hover:animate-bounce" />
            Ver Catálogo 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a 
            href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("Hola! Quiero info sobre impresiones 3D")}`} 
            target="_blank"
            className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 shadow-lg shadow-green-500/30 rounded-2xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 flex items-center gap-3"
          >
            <span className="text-2xl">💬</span>
            Consultar
          </a>
        </MotionDiv>

        {/* Badge de ubicación */}
        <MotionDiv 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-10 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full">
            <span className="text-lg">📍</span>
            <span className="text-sm text-gray-400">Corrientes, Argentina</span>
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          </div>
        </MotionDiv>
      </div>
    </header>
  );
}