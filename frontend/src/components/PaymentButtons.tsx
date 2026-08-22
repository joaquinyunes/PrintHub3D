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
  customer: { name: string; phone: string };
  validate: () => boolean;
  onWhatsAppCheckout: () => void;
  clearCart: () => void;
}

export default function PaymentButtons({
  total,
  depositTotal,
  items,
  customer,
  validate,
  onWhatsAppCheckout,
}: PaymentButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMercadoPago = async (payFull: boolean) => {
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/payments/create-preference"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: customer.name.trim(),
          customerContact: customer.phone.trim(),
          deposit: !payFull,
          items: items.map((item) => ({
            productId: item.product._id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error creando la preferencia de pago");

      const url = data.initPoint || data.sandboxInitPoint;
      if (!url) throw new Error("MercadoPago no devolvió un link de pago");

      // El carrito se limpia en /checkout/resultado tras confirmar el pago.
      window.location.href = url;
    } catch (err: any) {
      console.error("MercadoPago error:", err);
      setError(err.message || "Error al procesar el pago. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          if (validate()) onWhatsAppCheckout();
        }}
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

      {error && (
        <p className="text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
          {error}
        </p>
      )}

      {MERCADO_PAGO_ALIAS && MERCADO_PAGO_ALIAS !== "TU_ALIAS_AQUI" && (
        <div className="text-center text-xs text-gray-500 mt-2">
          <p>
            Alias para transferencia:{" "}
            <span className="text-blue-400 font-mono">{MERCADO_PAGO_ALIAS}</span>
          </p>
        </div>
      )}
    </div>
  );
}
