"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Phone, Mail, Loader2, ArrowRight, ChevronLeft } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function MagicLoginPage() {
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
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setSentTo(data.sentTo);
      setStep("verify");
    } catch (err: any) {
      setError(err.message);
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
        body: JSON.stringify({ identifier, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          token: data.token,
          user: data.user,
        })
      );

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isEmail = identifier.includes("@");

  return (
    <div className="min-h-screen bg-tone-darker flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-tone-dark/60 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-tone-red" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acceso Mágico</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa tu email o WhatsApp para recibir un código</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-tone-red/30 bg-tone-red/10 text-tone-red text-sm">
            {error}
          </div>
        )}

        {step === "input" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="relative">
              {isEmail ? (
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-600" />
              ) : (
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-600" />
              )}
              <input
                type={isEmail ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isEmail ? "tu@email.com" : "5493794000000"}
                required
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-tone-red/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tone-red hover:bg-tone-red/90 disabled:bg-gray-800 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Enviar Código
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-4 border border-tone-red/30 bg-tone-red/10 rounded-lg text-center mb-4">
              <p className="text-tone-red text-sm uppercase tracking-[0.15em]">
                {sentTo === "whatsapp"
                  ? "Código enviado por WhatsApp"
                  : "Código enviado por email"}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Revisa tu {sentTo === "whatsapp" ? "WhatsApp" : "email"} y verifica el código de 6 dígitos
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg py-4 text-center text-2xl tracking-[0.3em] text-white placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-tone-red hover:bg-tone-red/90 disabled:bg-gray-800 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("input");
                setCode("");
                setError("");
              }}
              className="w-full text-gray-600 text-sm py-2 hover:text-white transition flex items-center justify-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Cambiar email/teléfono
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-gray-600 text-xs">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-gray-600 hover:text-white transition">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}
