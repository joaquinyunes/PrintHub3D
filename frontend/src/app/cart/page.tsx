"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import PaymentButtons from "@/components/PaymentButtons";
import { WHATSAPP_PHONE } from "@/lib/config";

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart, total, depositTotal, itemCount } = useCart();

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-tone-darker text-white flex items-center justify-center font-mono">
        <div className="text-center">
          <ShoppingCart className="w-20 h-20 text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-400 mb-6">Agregá productos para comenzar tu compra</p>
          <Link href="/#productos" className="bg-tone-red hover:bg-tone-red/90 text-white px-6 py-3 rounded-xl font-medium transition">
            Ver Productos
          </Link>
        </div>
      </div>
    );
  }

  const handleWhatsAppCheckout = () => {
    const itemsList = items.map(item =>
      `• ${item.product.name} x${item.quantity} - $${(item.product.price * item.quantity).toLocaleString("es-AR")}`
    ).join("%0A");

    const message = `*NUEVO PEDIDO - PrintHub3D*%0A%0A${itemsList}%0A%0A*Total:* $${total.toLocaleString("es-AR")}%0A*Seña (50%):* $${depositTotal.toLocaleString("es-AR")}%0A%0APor favor confirmar disponibilidad y datos para el envío.`;

    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-tone-darker text-white font-mono">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-tone-red/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-white mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <h1 className="text-3xl font-bold mb-8">Carrito de Compras</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.product._id} className="bg-tone-dark/60 border border-white/5 rounded-xl p-4 flex gap-4">
                <div className="w-20 h-20 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">📦</div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold">{item.product.name}</h3>
                  <span className="inline-block border-tone-red/30 bg-tone-red/10 text-tone-red text-xs tracking-[0.15em] uppercase rounded-full px-4 py-1.5 mt-1">
                    {item.product.category}
                  </span>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-tone-red font-bold">${item.product.price.toLocaleString("es-AR")}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeFromCart(item.product._id)}
                        className="w-8 h-8 rounded-lg bg-tone-red/10 hover:bg-tone-red/20 flex items-center justify-center text-tone-red transition ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-tone-dark/60 border border-white/5 rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Resumen</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-400">
                <span>Productos ({itemCount})</span>
                <span>${total.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-tone-amber">
                <span>Seña requerida (50%)</span>
                <span className="font-bold">${depositTotal.toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total.toLocaleString("es-AR")}</span>
              </div>
            </div>

            <PaymentButtons
              total={total}
              depositTotal={depositTotal}
              items={items}
              onWhatsAppCheckout={handleWhatsAppCheckout}
              clearCart={clearCart}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
