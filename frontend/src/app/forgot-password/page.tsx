"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import AuthShell, { FormError } from "@/components/store/AuthShell";

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="Revisá tu email">
        <p className="text-ink-soft">
          Si esa dirección tiene una cuenta, te enviamos un enlace para restablecer la contraseña. Vence en
          30 minutos.
        </p>
        <Link href="/admin/login" className="btn btn-paper mt-6 w-full">
          Volver a ingresar
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviamos un enlace por email para crear una nueva.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError>{error}</FormError>}
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Email</span>
          <input
            type="email"
            placeholder="tu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </label>
        <button type="submit" disabled={loading} className="btn btn-signal w-full disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar enlace
        </button>
        <p className="border-t-2 border-ink pt-4 text-center text-sm">
          <Link href="/admin/login" className="font-extrabold underline underline-offset-4">
            Volver a ingresar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
