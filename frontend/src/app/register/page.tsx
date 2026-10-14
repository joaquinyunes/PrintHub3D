"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import AuthShell, { FormError } from "@/components/store/AuthShell";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrar");

      setNeedsVerification(!!data.needsVerification);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell title="Cuenta creada">
        <p className="text-ink-soft">
          {needsVerification
            ? "Te enviamos un email para verificarla."
            : "Ya podés iniciar sesión."}
        </p>
        <Link href="/login" className="btn btn-signal mt-6 w-full">
          Ir a ingresar
        </Link>
      </AuthShell>
    );
  }

  const fields = [
    { key: "name", label: "Nombre completo", type: "text", placeholder: "Tu nombre" },
    { key: "email", label: "Email", type: "email", placeholder: "tu@email.com" },
    { key: "password", label: "Contraseña", type: "password", placeholder: "Mínimo 6 caracteres" },
    { key: "confirmPassword", label: "Repetir contraseña", type: "password", placeholder: "" },
  ] as const;

  return (
    <AuthShell title="Crear cuenta" subtitle="Para seguir tus pedidos y comprar más rápido.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError>{error}</FormError>}
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">{f.label}</span>
            <input
              type={f.type}
              placeholder={f.placeholder}
              required
              minLength={f.key === "password" ? 6 : undefined}
              value={formData[f.key]}
              onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
              className="field"
            />
          </label>
        ))}
        <button type="submit" disabled={loading} className="btn btn-signal w-full disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear cuenta
        </button>
        <p className="border-t-2 border-ink pt-4 text-center text-sm">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold underline underline-offset-4">
            Ingresá
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
