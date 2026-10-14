"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
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
    } catch (err: unknown) {
      console.error("MercadoPago error:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Error al procesar el pago. Intentá de nuevo.",
      );
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
        className="btn btn-signal w-full"
      >
        Pedir por WhatsApp (seña 50%)
      </button>

      {items.some((i) => i.product.catalog) ? (
        <p className="rounded-sm border-2 border-ink bg-white px-3 py-2 text-center text-sm">
          Estos productos se coordinan por WhatsApp: confirmamos stock y precio antes de cobrar.
        </p>
      ) : (
        <>
      <p className="text-center text-xs font-extrabold uppercase tracking-widest text-ink-soft">
        o pagá online
      </p>

      <button
        onClick={() => handleMercadoPago(false)}
        disabled={loading}
        className="btn btn-paper w-full disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Pagar seña · ${depositTotal.toLocaleString("es-AR")}
      </button>

      <button
        onClick={() => handleMercadoPago(true)}
        disabled={loading}
        className="btn btn-paper w-full disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Pagar total · ${total.toLocaleString("es-AR")}
      </button>

        </>
      )}

      {error && (
        <p role="alert" className="rounded-sm border-2 border-danger bg-white px-3 py-2 text-center text-sm font-bold text-danger">
          {error}
        </p>
      )}

      {MERCADO_PAGO_ALIAS && MERCADO_PAGO_ALIAS !== "TU_ALIAS_AQUI" && (
        <p className="pt-1 text-center text-xs text-ink-soft">
          Alias para transferencia: <span className="font-mono font-semibold text-ink">{MERCADO_PAGO_ALIAS}</span>
        </p>
      )}
    </div>
  );
}
