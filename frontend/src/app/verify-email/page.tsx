"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { apiUrl } from "@/lib/api";

type State = "loading" | "ok" | "error";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Falta el token de verificación en el enlace.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/verify-email"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) throw new Error(data.message || "No se pudo verificar la cuenta.");
        setState("ok");
        setMessage(data.message || "Email verificado correctamente.");
      } catch (err: any) {
        if (cancelled) return;
        setState("error");
        setMessage(err.message || "El enlace es inválido o expiró.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-tone-darker relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute h-96 w-96 bg-tone-red/10 rounded-full blur-[128px] -top-20 -left-20" />

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-tone-dark/60 border border-white/5 rounded-2xl p-8 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-tone-red animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white">Verificando tu cuenta…</h1>
            </>
          )}

          {state === "ok" && (
            <>
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Cuenta verificada</h1>
              <p className="text-tone-amber mb-6">{message}</p>
              <Link href="/login" className="inline-flex items-center gap-2 text-tone-red hover:text-tone-red/80">
                Iniciar sesión <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle className="w-14 h-14 text-tone-red mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">No se pudo verificar</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <Link href="/login" className="inline-flex items-center gap-2 text-tone-red hover:text-tone-red/80">
                Volver a iniciar sesión <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-tone-darker flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-tone-red animate-spin" />
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
