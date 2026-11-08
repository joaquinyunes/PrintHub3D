"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Operator {
  id: string;
  name: string;
  active: boolean;
  locked: boolean;
}

// Alta y baja de operarios del taller (solo admin). El PIN se guarda con bcrypt: no se puede volver a ver, solo cambiar.
export default function OperariosPage() {
  const [items, setItems] = useState<Operator[]>([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/operators?all=1");
    if (res.ok) setItems((await res.json()).items);
  }, []);
  useEffect(() => { load(); }, [load]);

  const call = async (path: string, method: string, body: object) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await apiFetch(path, { method, body: JSON.stringify(body) });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setMsg(b.errors?.[0]?.message || b.message || "No se pudo guardar.");
        return false;
      }
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const create = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (await call("/api/operators", "POST", { name, pin })) { setName(""); setPin(""); }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">Operarios</h1>
      <p className="mb-6 text-sm text-gray-300">Cada persona que imprime tiene su PIN (4 a 8 dígitos, sin repetidos ni escaleras). Tras 5 errores se bloquea 15 minutos.</p>

      <form onSubmit={create} className="mb-8 grid max-w-xl gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_8rem_auto]">
        <label className="text-sm"><span className="mb-1 block">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} className="w-full rounded-lg bg-white/10 p-2" /></label>
        <label className="text-sm"><span className="mb-1 block">PIN</span>
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} type="password" inputMode="numeric" autoComplete="new-password" required minLength={4} className="w-full rounded-lg bg-white/10 p-2 tracking-widest" /></label>
        <button disabled={busy} className="self-end rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">Agregar</button>
      </form>
      {msg && <p role="alert" className="mb-4 text-sm text-red-300">{msg}</p>}

      <ul className="max-w-xl divide-y divide-white/10 rounded-2xl border border-white/10">
        {items.length === 0 && <li className="p-4 text-gray-300">Todavía no hay operarios.</li>}
        {items.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 p-3">
            <span className={o.active ? "" : "text-gray-400 line-through"}>{o.name}{o.locked ? " · bloqueado" : ""}</span>
            <span className="flex gap-2">
              <button
                onClick={() => { const p = window.prompt(`Nuevo PIN para ${o.name} (4 a 8 dígitos)`); if (p) call(`/api/operators/${o.id}`, "PATCH", { pin: p }); }}
                className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20">Cambiar PIN</button>
              <button onClick={() => call(`/api/operators/${o.id}`, "PATCH", { active: !o.active })} className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
                {o.active ? "Desactivar" : "Activar"}</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
