import React from "react";
import Link from "next/link";
import { ShoppingCart, Box, Search, ArrowRight, Package } from "lucide-react";
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

export default function HeroSection({
  searchQuery, setSearchQuery, trackingCode, setTrackingCode, handleTrackOrder, handleWhatsAppBuy, user, handleLogout
}: HeroSectionProps) {
  return (
    <header className="pt-16 pb-8 text-center px-4">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
        Catálogo Online
      </h1>
      <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
        Modelos 3D personalizados de alta calidad
      </p>
      
      <div className="mt-6 h-[1px] w-32 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      
      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mt-6">
        <span>⭐ <span className="text-yellow-400">4.9/5</span> clientes</span>
        <span>📦 <span className="text-green-400">+150</span> pedidos</span>
        <span>🚚 Entrega <span className="text-blue-400">24-72hs</span></span>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <a href="#productos" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 shadow-lg shadow-blue-500/30 rounded-xl font-medium transition flex items-center gap-2">
          Ver Catálogo <ArrowRight className="w-4 h-4" />
        </a>
        <a href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("Hola! Quiero info sobre impresiones 3D")}`} target="_blank"
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 shadow-lg shadow-green-500/30 rounded-xl font-medium transition flex items-center gap-2">
          Consultar
        </a>
      </div>
    </header>
  );
}
