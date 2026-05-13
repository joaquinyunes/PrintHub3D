"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al registrar");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute h-96 w-96 bg-green-500/10 rounded-full blur-[128px] -top-20 -left-20" />
        
        <div className="relative z-10 w-full max-w-md p-8">
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Registro exitoso!</h2>
            <p className="text-gray-400 mb-6">
              Tu cuenta ha sido creada. Te hemos enviado un email de verificación.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              Ir a iniciar sesión <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute h-96 w-96 bg-blue-500/10 rounded-full blur-[128px] -top-20 -left-20" />
      <div className="absolute h-96 w-96 bg-purple-500/10 rounded-full blur-[128px] -bottom-20 -right-20" />

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">Global 3D</h1>
          <p className="text-gray-400 mt-2">Crea tu cuenta de cliente</p>
        </div>

        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Tu nombre completo"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                type="email"
                placeholder="tu@email.com"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                type="password"
                placeholder="Contraseña"
                required
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white">
              ¿Ya tenés cuenta? <span className="text-blue-400">Iniciar sesión</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}