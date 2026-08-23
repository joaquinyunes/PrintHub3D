"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Search, Plus, X, CheckCircle, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";

interface Sale {
  _id: string;
  productName: string;
  quantity: number;
  price: number;
  profit: number;
  category: string;
  client?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

const emptyForm = { productName: "", quantity: "1", client: "", paymentMethod: "Efectivo", price: "", notes: "" };
const formasPago = ["Efectivo", "Transferencia", "Mercado Pago", "Débito/Crédito", "Otro"];

export default function AdminVentas() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/sales?pageSize=200"), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("No se pudo cargar el historial de ventas");
      const data = await res.json();
      setSales(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = sales.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.productName.toLowerCase().includes(q) ||
      (v.client || "").toLowerCase().includes(q)
    );
  });

  const totalMonto = filtered.reduce((s, v) => s + v.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/sales"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          productName: form.productName.trim(),
          quantity: Number(form.quantity) || 1,
          price: Number(form.price) || 0,
          client: form.client.trim(),
          paymentMethod: form.paymentMethod,
          notes: form.notes.trim(),
          category: "Mostrador",
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Error al registrar");
      setForm(emptyForm);
      setShowForm(false);
      setToast("Venta registrada");
      setTimeout(() => setToast(""), 3000);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-medium">
          <CheckCircle className="inline w-4 h-4 mr-1" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tone-amber/10 rounded-xl">
            <DollarSign className="w-6 h-6 text-tone-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Ventas de mostrador</h1>
            <p className="text-xs text-gray-600">
              ${totalMonto.toLocaleString("es-AR")} · {filtered.length} registros
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cerrar" : "Nueva venta"}
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-tone-red bg-tone-red/10 border border-tone-red/20 rounded-xl px-4 py-2.5">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-tone-dark/60 border border-white/5 rounded-xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Producto / concepto</label>
              <input required value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Cliente (opcional)</label>
              <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Cantidad</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Forma de pago</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40 [&>option]:bg-tone-darker">
                {formasPago.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Total ($)</label>
              <input type="number" min={0} step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Observaciones</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-tone-red hover:bg-tone-red/90 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar venta"}
          </button>
        </form>
      )}

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ventas..."
          className="w-full bg-tone-darker/80 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-tone-red animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => (
            <div key={v._id} className="bg-tone-dark/60 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-tone-amber/20 transition">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{v.productName}</p>
                <p className="text-sm text-gray-400 truncate">
                  {[v.client, `${v.quantity} unid.`, v.notes].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-tone-amber font-black">${v.price.toLocaleString("es-AR")}</p>
                <p className="text-xs text-gray-600">
                  {[v.paymentMethod, new Date(v.createdAt).toLocaleDateString("es-AR")].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
