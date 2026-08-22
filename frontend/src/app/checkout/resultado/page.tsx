"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { apiUrl } from "@/lib/api";

type UiState = "loading" | "approved" | "pending" | "rejected";

function Resultado() {
  const params = useSearchParams();
  const { clearCart } = useCart();

  const rawStatus = params.get("status") || params.get("collection_status") || "";
  const orderId = params.get("external_reference") || "";

  const [state, setState] = useState<UiState>("loading");
  const [trackingCode, setTrackingCode] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const map = (s: string): UiState =>
      s === "approved" ? "approved" : s === "pending" || s === "in_process" ? "pending" : "rejected";

    const poll = async () => {
      if (!orderId) {
        setState(map(rawStatus));
        return;
      }
      try {
        const res = await fetch(apiUrl(`/api/payments/status/${orderId}`));
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.trackingCode) setTrackingCode(data.trackingCode);
          if (data.paid) {
            setState("approved");
            clearCart();
            return;
          }
        }
      } catch {
        /* reintenta */
      }

      attempts += 1;
      if (attempts < 5 && rawStatus === "approved") {
        setTimeout(poll, 2000);
      } else {
        const finalState = map(rawStatus);
        if (!cancelled) {
          setState(finalState);
          if (finalState === "approved") clearCart();
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, rawStatus]);

  return (
    <div className="min-h-screen bg-tone-darker text-white font-mono flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-tone-dark/60 border border-white/5 rounded-2xl p-8 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="w-14 h-14 text-tone-red animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold">Confirmando tu pago…</h1>
          </>
        )}

        {state === "approved" && (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">¡Pago confirmado!</h1>
            <p className="text-gray-400 text-sm mb-4">
              Ya registramos tu pedido. Te vamos a contactar por WhatsApp para coordinar.
            </p>
            {trackingCode && (
              <div className="bg-tone-darker/80 border border-white/10 rounded-xl py-3 px-4 mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Código de seguimiento</p>
                <p className="text-lg font-black text-tone-amber">{trackingCode}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              {trackingCode && (
                <Link
                  href={`/track?code=${encodeURIComponent(trackingCode)}`}
                  className="bg-tone-red hover:bg-tone-red/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  Seguir mi pedido
                </Link>
              )}
              <Link href="/" className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
                Volver al inicio
              </Link>
            </div>
          </>
        )}

        {state === "pending" && (
          <>
            <Clock className="w-14 h-14 text-tone-amber mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pago en revisión</h1>
            <p className="text-gray-400 text-sm mb-4">
              MercadoPago todavía está procesando el pago. Apenas se acredite te avisamos por WhatsApp.
            </p>
            {trackingCode && <p className="text-sm text-tone-amber font-bold mb-4">Código: {trackingCode}</p>}
            <Link href="/" className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
              Volver al inicio
            </Link>
          </>
        )}

        {state === "rejected" && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">El pago no se completó</h1>
            <p className="text-gray-400 text-sm mb-4">
              No se realizó ningún cargo. Podés volver al carrito e intentar de nuevo.
            </p>
            <Link href="/cart" className="bg-tone-red hover:bg-tone-red/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
              Volver al carrito
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-tone-darker flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-tone-red animate-spin" />
        </div>
      }
    >
      <Resultado />
    </Suspense>
  );
}
