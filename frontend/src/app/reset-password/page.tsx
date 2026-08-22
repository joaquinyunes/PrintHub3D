"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { apiUrl } from "@/lib/api";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace no tiene token. Pedí uno nuevo desde 'Olvidé mi contraseña'.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/auth/reset-password/${encodeURIComponent(token)}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "No se pudo actualizar la contraseña.");
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "El enlace es inválido o expiró.");
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
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Contraseña actualizada</h1>
              <p className="text-tone-amber mb-6">Te llevamos al inicio de sesión…</p>
              <Link href="/login" className="inline-flex items-center gap-2 text-tone-red hover:text-tone-red/80">
                Iniciar sesión <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Nueva contraseña</h1>
              <p className="text-gray-400 text-sm mb-6">Elegí una contraseña nueva para tu cuenta.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="border border-tone-red/30 bg-tone-red/10 rounded-lg p-3 text-tone-red text-sm">
                    {error}
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-tone-amber" />
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-tone-darker/80 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-tone-red/40"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-tone-amber" />
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-tone-darker/80 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-tone-red/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-tone-red text-white font-bold py-3 rounded-lg hover:bg-tone-red/90 disabled:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cambiar contraseña"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-gray-400 hover:text-white">
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-tone-darker flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-tone-red animate-spin" />
        </div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
