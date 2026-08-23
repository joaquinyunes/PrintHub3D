"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Spool, Plus, Search, Loader2, Minus, RefreshCw, Trash2, X, AlertTriangle } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";

interface Filament {
  _id: string;
  brand: string;
  material: string;
  color: string;
  costPerKg: number;
  gramsTotal: number;
  gramsRemaining: number;
  spools: number;
  lowThresholdGrams: number;
  notes: string;
}

const empty = {
  brand: "",
  material: "PLA",
  color: "",
  costPerKg: "",
  gramsTotal: "1000",
  spools: "1",
  lowThresholdGrams: "200",
  notes: "",
};

export default function AdminFilamento() {
  const [items, setItems] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterMat, setFilterMat] = useState("Todos");
  const [modal, setModal] = useState<null | { mode: "new" } | { mode: "edit"; item: Filament }>(null);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [saving, setSaving] = useState(false);

  const authHeaders = () => ({ "Content-Type": "application/json", ...getAuthHeaders() });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/filaments"), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("No se pudieron cargar los filamentos");
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const materials = useMemo(
    () => ["Todos", ...Array.from(new Set(items.map((f) => f.material)))],
    [items],
  );

  const filtered = items.filter((f) => {
    if (filterMat !== "Todos" && f.material !== filterMat) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return f.brand.toLowerCase().includes(q) || f.color.toLowerCase().includes(q);
  });

  const totalKg = filtered.reduce((s, f) => s + f.gramsRemaining / 1000, 0);
  const inventoryValue = filtered.reduce((s, f) => s + (f.gramsRemaining / 1000) * f.costPerKg, 0);
  const lowCount = items.filter((f) => f.gramsRemaining <= f.lowThresholdGrams).length;

  const openNew = () => {
    setForm(empty);
    setModal({ mode: "new" });
  };
  const openEdit = (item: Filament) => {
    setForm({
      brand: item.brand,
      material: item.material,
      color: item.color,
      costPerKg: String(item.costPerKg),
      gramsTotal: String(item.gramsTotal),
      spools: String(item.spools),
      lowThresholdGrams: String(item.lowThresholdGrams),
      notes: item.notes || "",
    });
    setModal({ mode: "edit", item });
  };

  const save = async () => {
    if (!form.brand.trim()) {
      setError("La marca es obligatoria");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        brand: form.brand.trim(),
        material: form.material.trim() || "PLA",
        color: form.color.trim() || "Negro",
        costPerKg: Number(form.costPerKg) || 0,
        gramsTotal: Number(form.gramsTotal) || 1000,
        spools: Number(form.spools) || 1,
        lowThresholdGrams: Number(form.lowThresholdGrams) || 200,
        notes: form.notes.trim(),
      };
      const isEdit = modal?.mode === "edit";
      const url = isEdit ? `/api/filaments/${modal.item._id}` : "/api/filaments";
      const res = await fetch(apiUrl(url), {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Error al guardar");
      setModal(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const action = async (id: string, path: string, body: object) => {
    try {
      const res = await fetch(apiUrl(`/api/filaments/${id}/${path}`), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Error");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este filamento?")) return;
    await fetch(apiUrl(`/api/filaments/${id}`), { method: "DELETE", headers: getAuthHeaders() });
    await load();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tone-red/10 rounded-xl">
            <Spool className="w-6 h-6 text-tone-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Filamento</h1>
            <p className="text-xs text-gray-600">
              {totalKg.toFixed(2)} kg · {items.length} variedades · valor ${inventoryValue.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {lowCount > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-tone-amber bg-tone-amber/10 border border-tone-amber/20 rounded-xl px-4 py-2.5">
          <AlertTriangle className="w-4 h-4" /> {lowCount} filamento(s) por debajo del umbral de reposición
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-tone-red bg-tone-red/10 border border-tone-red/20 rounded-xl px-4 py-2.5">{error}</div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca o color..."
            className="w-full bg-tone-darker/80 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {materials.map((m) => (
            <button
              key={m}
              onClick={() => setFilterMat(m)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                filterMat === m ? "bg-tone-red text-white" : "bg-white/5 text-gray-400 hover:bg-tone-red/10 hover:text-tone-red"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-tone-red animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">
          <Spool className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No hay filamentos cargados.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const pct = f.gramsTotal > 0 ? Math.min(100, (f.gramsRemaining / f.gramsTotal) * 100) : 0;
            const low = f.gramsRemaining <= f.lowThresholdGrams;
            return (
              <div key={f._id} className="bg-tone-dark/60 border border-white/5 rounded-xl px-4 py-3 hover:border-tone-red/20 transition">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openEdit(f)} className="text-white font-bold hover:text-tone-red transition text-left">
                      {f.color} <span className="text-gray-600 font-normal">· {f.brand}</span>
                    </button>
                    <div className="mt-1.5 h-1.5 w-full max-w-xs bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full ${low ? "bg-tone-red" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-lg font-black ${low ? "text-tone-red" : "text-green-400"}`}>
                      {(f.gramsRemaining / 1000).toFixed(2)} kg
                    </span>
                    <p className="text-xs text-gray-600">{f.material} · {f.spools} bobina(s) · ${f.costPerKg}/kg</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      title="Consumir 100 g"
                      onClick={() => action(f._id, "consume", { grams: 100 })}
                      className="p-2 rounded-lg bg-white/5 hover:bg-tone-red/10 text-gray-400 hover:text-tone-red transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      title="Recargar bobina"
                      onClick={() => action(f._id, "refill", { addSpool: true })}
                      className="p-2 rounded-lg bg-white/5 hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      title="Eliminar"
                      onClick={() => remove(f._id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-tone-red/10 text-gray-400 hover:text-tone-red transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-tone-dark border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-white">
                {modal.mode === "edit" ? "Editar filamento" : "Nuevo filamento"}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {([
                ["brand", "Marca", "text"],
                ["material", "Material (PLA, PETG…)", "text"],
                ["color", "Color", "text"],
                ["costPerKg", "Costo por kg ($)", "number"],
                ["gramsTotal", "Gramos por bobina", "number"],
                ["spools", "Bobinas", "number"],
                ["lowThresholdGrams", "Alerta bajo (g)", "number"],
              ] as const).map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-tone-darker border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-tone-red/40"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full mt-5 bg-tone-red hover:bg-tone-red/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
