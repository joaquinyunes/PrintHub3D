"use client";

import { useCallback, useEffect, useState } from "react";
import { UserCog, Plus, Loader2, X, Copy, Check, ShieldCheck, User as UserIcon } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";

interface PanelUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  active: boolean;
  createdAt: string;
}

const headers = () => ({ "Content-Type": "application/json", ...getAuthHeaders() });

export default function UsuariosPage() {
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "staff", password: "" });
  const [saving, setSaving] = useState(false);
  const [tempPass, setTempPass] = useState<{ email: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/users"), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("No se pudo cargar la lista de usuarios");
      setUsers((await res.json()).items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nombre y email son obligatorios");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/users"), { method: "POST", headers: headers(), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear");
      if (data.tempPassword) setTempPass({ email: data.email, pass: data.tempPassword });
      setShowNew(false);
      setForm({ name: "", email: "", role: "staff", password: "" });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: object) => {
    try {
      const res = await fetch(apiUrl(`/api/users/${id}`), { method: "PATCH", headers: headers(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      if (data.tempPassword) setTempPass({ email: data.email, pass: data.tempPassword });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este usuario? Perderá el acceso al panel.")) return;
    const res = await fetch(apiUrl(`/api/users/${id}`), { method: "DELETE", headers: getAuthHeaders() });
    if (!res.ok) setError((await res.json().catch(() => ({}))).message || "Error al eliminar");
    await load();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-tone-red/10 p-2">
            <UserCog className="h-6 w-6 text-tone-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Usuarios del panel</h1>
            <p className="text-xs text-gray-600">Dueño (admin) y operarios (staff). Los operarios no ven caja ni configuración.</p>
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-xl bg-tone-red px-4 py-2.5 text-sm font-bold text-white transition hover:bg-tone-red/90"
        >
          <Plus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-tone-red/20 bg-tone-red/10 px-4 py-2.5 text-sm text-tone-red">{error}</div>}

      {tempPass && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-tone-amber/20 bg-tone-amber/10 px-4 py-3 text-sm text-tone-amber">
          Contraseña temporal de <b>{tempPass.email}</b>:
          <code className="rounded bg-black/30 px-2 py-1 font-mono text-white">{tempPass.pass}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(tempPass.pass);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1 text-tone-amber hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} copiar
          </button>
          <button onClick={() => setTempPass(null)} className="ml-auto text-gray-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-tone-red" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => patch(u.id, { role: e.target.value })}
                      className="rounded-lg border border-white/10 bg-tone-darker px-2 py-1.5 text-xs text-white focus:outline-none [&>option]:bg-tone-darker"
                    >
                      <option value="admin">Dueño (admin)</option>
                      <option value="staff">Operario (staff)</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => patch(u.id, { active: !u.active })}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        u.active ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {u.active ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                      {u.active ? "Activo" : "Desactivado"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => patch(u.id, { resetPassword: true })} className="text-xs text-gray-500 hover:text-tone-amber">
                      Resetear clave
                    </button>
                    <span className="mx-2 text-white/10">·</span>
                    <button onClick={() => remove(u.id)} className="text-xs text-gray-500 hover:text-tone-red">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-tone-dark p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Nuevo usuario</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-tone-darker px-3 py-2.5 text-sm text-white focus:border-tone-red/40 focus:outline-none"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-tone-darker px-3 py-2.5 text-sm text-white focus:border-tone-red/40 focus:outline-none"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-tone-darker px-3 py-2.5 text-sm text-white focus:outline-none [&>option]:bg-tone-darker"
              >
                <option value="staff">Operario (staff)</option>
                <option value="admin">Dueño (admin)</option>
              </select>
              <input
                placeholder="Contraseña (opcional — se genera una si la dejás vacía)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-tone-darker px-3 py-2.5 text-sm text-white focus:border-tone-red/40 focus:outline-none"
              />
            </div>
            <button
              onClick={create}
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-tone-red py-2.5 font-bold text-white transition hover:bg-tone-red/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
