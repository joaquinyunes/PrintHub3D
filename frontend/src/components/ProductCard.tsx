import React from "react";
import { ShoppingCart, Plus, Box } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  handleWhatsAppBuy: (item: Product) => void;
  idx: number;
}

export default function ProductCard({ product, handleWhatsAppBuy, idx }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div
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
        <div className="flex justify-between items-center mt-3 gap-2">
          <span className="text-xl font-bold text-blue-400">${product.price}</span>
          <div className="flex gap-2">
            <button onClick={() => addToCart(product)} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-xl transition" title="Agregar al carrito">
              <Plus size={18} />
            </button>
            <button onClick={() => handleWhatsAppBuy(product)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 shadow-lg shadow-green-500/30 text-white p-2 rounded-xl transition" title="Comprar por WhatsApp">
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
