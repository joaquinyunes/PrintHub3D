"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Supply { _id: string; name: string; unit: string; stock: number; minStock: number; low: boolean }
interface Plan {
  create: { name: string; unit: string; stock: number }[];
  update: { name: string; changes: Record<string, { from: unknown; to: unknown }> }[];
  unchanged: number;
  invalid: { row: number; reason: string }[];
}

// Insumos que no son filamento (argollas, imanes, cajas…): stock con aviso de mínimo y sincronización de planilla.
export default function InsumosPage() {
  const [items, setItems] = useState<Supply[]>([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", unit: "unidades", stock: "0", minStock: "0" });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/supplies");
    if (res.ok) setItems((await res.json()).items);
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async (path: string, method: string, body: object) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await apiFetch(path, { method, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(data.errors?.[0]?.message || data.message || "No se pudo completar la acción."); return null; }
      return data;
    } finally {
      setBusy(false);
    }
  };

  const create = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (await send("/api/supplies", "POST", { name: form.name, unit: form.unit, stock: Number(form.stock) || 0, minStock: Number(form.minStock) || 0 })) {
      setForm({ name: "", unit: "unidades", stock: "0", minStock: "0" });
      await load();
    }
  };

  const adjust = async (s: Supply, delta: number) => {
    if (await send(`/api/supplies/${s._id}/adjust`, "POST", { delta })) await load();
  };

  const sync = async (apply: boolean) => {
    const data = await send("/api/supplies/sync", "POST", { apply });
    if (!data) return;
    setPlan(data.plan);
    if (apply) { setMsg("Planilla aplicada."); await load(); }
  };

  const input = "w-full rounded-lg bg-white/10 p-2 text-white";
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">Insumos</h1>
      <p className="mb-6 text-sm text-gray-300">Argollas, imanes, cajas y todo lo que no es filamento. En rojo, los que llegaron al mínimo.</p>

      <form onSubmit={create} className="mb-8 grid max-w-3xl gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_8rem_6rem_6rem_auto]">
        <label className="text-sm"><span className="mb-1 block">Nombre</span><input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} /></label>
        <label className="text-sm"><span className="mb-1 block">Unidad</span><input className={input} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} maxLength={20} /></label>
        <label className="text-sm"><span className="mb-1 block">Stock</span><input className={input} inputMode="decimal" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
        <label className="text-sm"><span className="mb-1 block">Mínimo</span><input className={input} inputMode="decimal" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></label>
        <button disabled={busy} className="self-end rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">Agregar</button>
      </form>

      {msg && <p role="alert" className="mb-4 text-sm text-red-300">{msg}</p>}

      <ul className="mb-10 max-w-3xl divide-y divide-white/10 rounded-2xl border border-white/10">
        {items.length === 0 && <li className="p-4 text-gray-300">Todavía no hay insumos.</li>}
        {items.map((s) => (
          <li key={s._id} className="flex items-center justify-between gap-3 p-3">
            <span>{s.name} <span className="text-xs text-gray-300">({s.unit})</span>{s.low && <span className="ml-2 rounded bg-red-700 px-2 py-0.5 text-xs font-bold">bajo mínimo ({s.minStock})</span>}</span>
            <span className="flex items-center gap-2">
              <button onClick={() => adjust(s, -1)} aria-label={`Restar uno a ${s.name}`} className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20">−</button>
              <span className="w-16 text-center font-mono">{s.stock}</span>
              <button onClick={() => adjust(s, 1)} aria-label={`Sumar uno a ${s.name}`} className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20">+</button>
            </span>
          </li>
        ))}
      </ul>

      <section aria-labelledby="sync" className="max-w-3xl rounded-2xl border border-white/10 p-4">
        <h2 id="sync" className="mb-1 font-semibold">Sincronizar con la planilla de Google</h2>
        <p className="mb-3 text-sm text-gray-300">Primero «Ver diferencias» (no cambia nada); si está bien, «Aplicar». La planilla solo se lee: nunca se modifica ni se borran insumos.</p>
        <div className="flex gap-2">
          <button onClick={() => sync(false)} disabled={busy} className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20 disabled:opacity-50">Ver diferencias</button>
          <button onClick={() => sync(true)} disabled={busy || !plan} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold disabled:opacity-50">Aplicar</button>
        </div>
        {plan && (
          <div className="mt-4 text-sm" aria-live="polite">
            <p>{plan.create.length} nuevos · {plan.update.length} a actualizar · {plan.unchanged} sin cambios · {plan.invalid.length} filas con error</p>
            {plan.invalid.length > 0 && <ul className="mt-2 list-disc pl-5 text-red-300">{plan.invalid.map((i) => <li key={i.row}>Fila {i.row}: {i.reason}</li>)}</ul>}
          </div>
        )}
      </section>
    </div>
  );
}
