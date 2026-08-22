"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "No se pudo procesar la solicitud.");
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-tone-darker relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute h-96 w-96 bg-tone-red/10 rounded-full blur-[128px] -top-20 -left-20" />

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-tone-dark/60 border border-white/5 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Revisá tu email</h1>
              <p className="text-gray-400 mb-6">
                Si esa dirección tiene una cuenta, te enviamos un enlace para restablecer la contraseña. Vence en 30 minutos.
              </p>
              <Link href="/admin/login" className="text-tone-red hover:text-tone-red/80">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Recuperar contraseña</h1>
              <p className="text-gray-400 text-sm mb-6">Te enviamos un enlace por email para crear una nueva.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="border border-tone-red/30 bg-tone-red/10 rounded-lg p-3 text-tone-red text-sm">
                    {error}
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-tone-amber" />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-tone-darker/80 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-tone-red/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-tone-red text-white font-bold py-3 rounded-lg hover:bg-tone-red/90 disabled:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar enlace"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/admin/login" className="text-sm text-gray-400 hover:text-white">
                  Volver a <span className="text-tone-red">iniciar sesión</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
