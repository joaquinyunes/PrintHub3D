"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Lock, Mail, ArrowRight, Loader2, WifiOff } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    // detect if backend is reachable
    fetch(apiUrl("/api/auth/login"), { method: "HEAD" })
      .then(() => setOffline(false))
      .catch(() => setOffline(true))
      .finally(() => setChecking(false));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Credenciales incorrectas");
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            name: data.user.name ?? "Admin",
          },
        })
      );
      router.push("/admin");
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        setOffline(true);
        setError("No se puede contactar al servidor. Reintentá en unos minutos.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tone-darker">
        <Loader2 className="w-6 h-6 text-tone-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tone-darker font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute h-96 w-96 bg-tone-red/10 rounded-full blur-[128px] -top-20 -left-20" />
      <div className="absolute h-96 w-96 bg-tone-amber/10 rounded-full blur-[128px] -bottom-20 -right-20" />

      <div className="relative z-10 w-full max-w-md p-8 bg-tone-dark/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center mb-4">
            <Box className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acceso Privado</h1>
          <p className="text-gray-600 text-sm">Global 3D Corrientes OS</p>
        </div>

        {offline && !error && (
          <div className="mb-4 p-3 rounded-lg bg-tone-amber/10 border border-tone-amber/20 text-tone-amber text-xs text-center flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" /> Sin conexión al servidor
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-tone-red/10 border border-tone-red/20 text-tone-red text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-600" />
            <input
              name="email"
              type="email"
              placeholder="admin@global3d.com"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-tone-darker/80 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-600" />
            <input
              name="password"
              type="password"
              placeholder="Contraseña Maestra"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-tone-darker/80 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition-all"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-tone-red hover:bg-tone-red/90 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Ingresar al Sistema
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a href="/forgot-password" className="block text-xs text-gray-500 hover:text-white transition">¿Olvidaste tu contraseña?</a>
          <p className="text-xs text-gray-600">Acceso restringido únicamente a personal autorizado.</p>
          <a href="/register" className="text-xs text-tone-amber hover:text-tone-amber/80">¿Eres cliente? Crea tu cuenta aquí</a>
        </div>
      </div>
    </div>
  );
}
