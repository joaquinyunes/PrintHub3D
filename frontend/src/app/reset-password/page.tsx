"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import AuthShell, { FormError } from "@/components/store/AuthShell";

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
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "El enlace es inválido o expiró.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Contraseña actualizada">
        <p className="text-ink-soft">Te llevamos a ingresar…</p>
        <Link href="/login" className="btn btn-signal mt-6 w-full">
          Ingresar
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Elegí una contraseña nueva para tu cuenta.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError>{error}</FormError>}
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Nueva contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Repetir contraseña</span>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="field"
          />
        </label>
        <button type="submit" disabled={loading} className="btn btn-signal w-full disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Cambiar contraseña
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="store grid min-h-screen place-items-center font-bold">Cargando…</div>}>
      <ResetInner />
    </Suspense>
  );
}
