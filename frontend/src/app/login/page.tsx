"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import AuthShell, { FormError } from "@/components/store/AuthShell";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"input" | "verify">("input");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState<"whatsapp" | "email" | "">("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/auth/magic/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSentTo(data.sentTo);
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/auth/magic/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("user", JSON.stringify({ user: data.user }));
      router.push(data.user.role === "admin" ? "/admin" : "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const isEmail = identifier.includes("@");

  return (
    <AuthShell
      title="Ingresar"
      subtitle={
        step === "input"
          ? "Ingresá tu email o WhatsApp y te mandamos un código."
          : `Revisá tu ${sentTo === "whatsapp" ? "WhatsApp" : "email"}: te enviamos un código de 6 dígitos.`
      }
    >
      <div className="space-y-4">
        {error && <FormError>{error}</FormError>}

        {step === "input" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">
                Email o WhatsApp
              </span>
              <input
                type={isEmail ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isEmail ? "tu@email.com" : "5493794000000"}
                required
                className="field"
              />
            </label>
            <button type="submit" disabled={loading} className="btn btn-signal w-full disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar código
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Código</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="field text-center text-2xl font-extrabold tracking-[0.4em]"
              />
            </label>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn btn-signal w-full disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setCode("");
                setError("");
              }}
              className="w-full text-sm font-bold underline underline-offset-4"
            >
              Cambiar email o teléfono
            </button>
          </form>
        )}

        <p className="border-t-2 border-ink pt-4 text-center text-sm">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-extrabold underline underline-offset-4">
            Registrate
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
