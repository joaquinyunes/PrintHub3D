"use client";

import React, { useState } from "react";
import { ShoppingCart, CreditCard, Loader2 } from "lucide-react";
import type { CartItem } from "@/context/CartContext";
import { apiUrl } from "@/lib/api";
import { MERCADO_PAGO_ALIAS } from "@/lib/config";

interface PaymentButtonsProps {
  total: number;
  depositTotal: number;
  items: CartItem[];
  onWhatsAppCheckout: () => void;
  clearCart: () => void;
}

export default function PaymentButtons({ total, depositTotal, items, onWhatsAppCheckout, clearCart }: PaymentButtonsProps) {
  const [loading, setLoading] = useState(false);

  const handleMercadoPago = async (payFull: boolean) => {
    setLoading(true);
    try {
      const itemsList = items.map(item => ({
        title: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const res = await fetch(apiUrl("/api/payments/create-preference"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsList,
          deposit: !payFull,
        })
      });

      if (!res.ok) throw new Error("Error creando preferencia");

      const data = await res.json();
      if (data.initPoint) {
        clearCart();
        window.location.href = data.initPoint;
      }
    } catch (err) {
      console.error("MercadoPago error:", err);
      alert("Error al procesar el pago. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={onWhatsAppCheckout}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-lg shadow-green-600/30"
      >
        <ShoppingCart className="w-5 h-5" />
        Comprar por WhatsApp (Seña 50%)
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-900 px-2 text-gray-500">o pagá con</span>
        </div>
      </div>

      <button
        onClick={() => handleMercadoPago(false)}
        disabled={loading}
        className="w-full bg-[#009EE3] hover:bg-[#008BD0] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
        Pagar Seña (50%) - ${depositTotal.toLocaleString("es-AR")}
      </button>

      <button
        onClick={() => handleMercadoPago(true)}
        disabled={loading}
        className="w-full bg-[#009EE3] hover:bg-[#008BD0] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
        Pagar Total - ${total.toLocaleString("es-AR")}
      </button>

      <div className="text-center text-xs text-gray-500 mt-2">
        <p>Alias para transferencia: <span className="text-blue-400 font-mono">{MERCADO_PAGO_ALIAS}</span></p>
      </div>
    </div>
  );
}
