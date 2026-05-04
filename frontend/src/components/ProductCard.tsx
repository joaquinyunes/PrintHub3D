import React from "react";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  handleWhatsAppBuy: (item: Product) => void;
  idx: number;
}

export default function ProductCard({ product, handleWhatsAppBuy, idx }: ProductCardProps) {
  return (
    <div 
      key={product._id} 
      className="relative group overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:scale-[1.06] hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition duration-1000" />
      </div>
      <div className="aspect-square bg-gray-800/50 overflow-hidden">
        {product.imageUrl ? 
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" /> :
          <div className="w-full h-full flex items-center justify-center text-gray-700"><Box className="w-16 h-16" /></div>
        }
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-black/60 backdrop-blur rounded-lg text-xs text-gray-300">{product.category}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold truncate mb-1">{product.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{product.description || "Personalizado"}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-xl font-bold text-blue-400">${product.price}</span>
          <button onClick={() => handleWhatsAppBuy(product)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 shadow-lg shadow-green-500/30 text-white p-2 rounded-xl transition" title="Comprar por WhatsApp">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Necesario para evitar error de importación en HeroSection
export function Box(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
}
