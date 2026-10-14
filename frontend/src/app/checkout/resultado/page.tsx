"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { apiUrl } from "@/lib/api";
import AuthShell from "@/components/store/AuthShell";

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

  if (state === "loading") {
    return (
      <AuthShell title="Confirmando tu pago">
        <p className="flex items-center gap-3 font-bold">
          <Loader2 className="h-5 w-5 animate-spin" /> Un momento…
        </p>
      </AuthShell>
    );
  }

  if (state === "approved") {
    return (
      <AuthShell title="Pago confirmado">
        <p className="text-ink-soft">
          Ya registramos tu pedido. Te vamos a contactar por WhatsApp para coordinar.
        </p>
        {trackingCode && (
          <div className="mt-5 rounded-md border-2 border-ink bg-signal px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em]">Código de seguimiento</p>
            <p className="font-display break-all text-xl">{trackingCode}</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {trackingCode && (
            <Link href={`/track?code=${encodeURIComponent(trackingCode)}`} className="btn btn-signal">
              Seguir mi pedido
            </Link>
          )}
          <Link href="/" className="btn btn-paper">
            Volver al inicio
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (state === "pending") {
    return (
      <AuthShell title="Pago en revisión">
        <p className="text-ink-soft">
          MercadoPago todavía está procesando el pago. Apenas se acredite te avisamos por WhatsApp.
        </p>
        {trackingCode && <p className="mt-4 font-bold">Código: {trackingCode}</p>}
        <Link href="/" className="btn btn-paper mt-6">
          Volver al inicio
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="El pago no se completó">
      <p className="text-ink-soft">
        No se realizó ningún cargo. Podés volver al carrito e intentar de nuevo.
      </p>
      <Link href="/cart" className="btn btn-signal mt-6">
        Volver al carrito
      </Link>
    </AuthShell>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={<div className="store grid min-h-screen place-items-center font-bold">Cargando…</div>}>
      <Resultado />
    </Suspense>
  );
}
