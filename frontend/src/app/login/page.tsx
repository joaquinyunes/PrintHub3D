"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Phone, Mail, Loader2, ArrowRight } from "lucide-react";
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

      // Redirección según rol
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
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acceso Mágico</h1>
          <p className="text-gray-400">Ingresa tu email o WhatsApp para recibir un código</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            {error}
          </div>
        )}

        {step === "input" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="relative">
              {isEmail ? (
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              ) : (
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              )}
              <input
                type={isEmail ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isEmail ? "tu@email.com" : "5493794000000"}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
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
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center mb-4">
              <p className="text-green-400 text-sm">
                {sentTo === "whatsapp" 
                  ? "Código enviado por WhatsApp" 
                  : "Código enviado por email"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Revisa tu {sentTo === "whatsapp" ? "WhatsApp" : "email"} y verifica el código de 6 dígitos
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Ingresa el código de 6 dígitos"
                maxLength={6}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg py-4 text-center text-2xl tracking-widest text-white uppercase placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-800 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
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
              className="w-full text-gray-400 text-sm py-2 hover:text-white"
            >
              ← Cambiar email/teléfono
            </button>
          </form>
        )}
      </div>
    </div>
  );
}