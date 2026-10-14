"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import AuthShell from "@/components/store/AuthShell";

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
      } catch (err: unknown) {
        if (cancelled) return;
        setState("error");
        setMessage(err instanceof Error && err.message ? err.message : "El enlace es inválido o expiró.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthShell
      title={
        state === "loading" ? "Verificando tu cuenta" : state === "ok" ? "Cuenta verificada" : "No se pudo verificar"
      }
    >
      {state === "loading" ? (
        <p className="flex items-center gap-3 font-bold">
          <Loader2 className="h-5 w-5 animate-spin" /> Un momento…
        </p>
      ) : (
        <>
          <p className="text-ink-soft">{message}</p>
          <Link href="/login" className="btn btn-signal mt-6 w-full">
            Ingresar
          </Link>
        </>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="store grid min-h-screen place-items-center font-bold">Cargando…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
